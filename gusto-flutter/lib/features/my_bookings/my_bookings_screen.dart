import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/constants/app_text_styles.dart';
import '../../data/models/booking_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/booking_provider.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/loading_shimmer.dart';
import '../../shared/widgets/primary_button.dart';

enum _BookingFilter { all, active, booked, completed }

class MyBookingsScreen extends ConsumerStatefulWidget {
  const MyBookingsScreen({super.key});

  @override
  ConsumerState<MyBookingsScreen> createState() => _MyBookingsScreenState();
}

class _MyBookingsScreenState extends ConsumerState<MyBookingsScreen> {
  RealtimeChannel? _bookingsChannel;
  _BookingFilter _filter = _BookingFilter.all;

  @override
  void initState() {
    super.initState();
    final userId = ref.read(currentUserProvider)?.id;
    if (userId != null) {
      _bookingsChannel = Supabase.instance.client
          .channel('user-bookings-$userId')
          .onPostgresChanges(
            event: PostgresChangeEvent.update,
            schema: 'public',
            table: 'bookings',
            filter: PostgresChangeFilter(
                type: PostgresChangeFilterType.eq,
                column: 'guest_id',
                value: userId),
            callback: (_) => ref.invalidate(userBookingsProvider),
          )
          .subscribe();
    }
  }

  @override
  void dispose() {
    _bookingsChannel?.unsubscribe();
    super.dispose();
  }

  List<BookingModel> _applyFilter(List<BookingModel> all) {
    switch (_filter) {
      case _BookingFilter.all:
        return all;
      case _BookingFilter.active:
        return all.where((b) => b.status == 'ACTIVE').toList();
      case _BookingFilter.booked:
        return all.where((b) => b.status == 'CONFIRMED').toList();
      case _BookingFilter.completed:
        return all.where((b) => b.status == 'COMPLETED').toList();
    }
  }

  @override
  Widget build(BuildContext context) {
    final bookingsAsync = ref.watch(userBookingsProvider);

    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('My Bookings', style: context.tsDisplay),
                  const SizedBox(height: 6),
                  Text(
                    'Manage your upcoming productions and terrace events.',
                    style: context.tsBody,
                  ),
                ],
              ),
            ),

            // Filter chips
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _BookingFilter.values.map((f) {
                    final isSelected = _filter == f;
                    final label = switch (f) {
                      _BookingFilter.all => 'All Bookings',
                      _BookingFilter.active => 'Active',
                      _BookingFilter.booked => 'Booked',
                      _BookingFilter.completed => 'Completed',
                    };
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: GestureDetector(
                        onTap: () => setState(() => _filter = f),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 7),
                          decoration: BoxDecoration(
                            color: isSelected ? kGreen : context.kSurface,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                                color: isSelected ? kGreen : context.kBorder),
                          ),
                          child: Text(
                            label,
                            style: TextStyle(
                              fontFamily: 'Inter',
                              fontSize: 13,
                              fontWeight: isSelected
                                  ? FontWeight.w600
                                  : FontWeight.w400,
                              color: isSelected
                                  ? kOnPrimary
                                  : context.kTextSecondary,
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),

            const SizedBox(height: 16),
            Divider(height: 1, color: context.kBorder),

            // Content
            Expanded(
              child: bookingsAsync.when(
                loading: () => ListView.separated(
                  padding: const EdgeInsets.all(20),
                  itemCount: 3,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (_, __) => const LoadingShimmer(height: 110),
                ),
                error: (e, _) => ErrorState(
                  message: 'Failed to load bookings',
                  onRetry: () => ref.invalidate(userBookingsProvider),
                ),
                data: (all) {
                  final filtered = _applyFilter(all);
                  if (filtered.isEmpty) {
                    return EmptyState(
                      message: AppStrings.noBookings,
                      ctaLabel: 'Explore terraces',
                      onCta: () {},
                    );
                  }
                  return ListView.separated(
                    padding: const EdgeInsets.all(20),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (_, i) => _BookingCard(
                      booking: filtered[i],
                      onCancel: () => _doCancel(context, filtered[i]),
                      onViewInvoice: () => _showDetail(context, filtered[i]),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _doCancel(BuildContext context, BookingModel booking) async {
    await ref
        .read(bookingNotifierProvider.notifier)
        .cancelBooking(booking.id);
    ref.invalidate(userBookingsProvider);
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Booking cancelled')),
      );
    }
  }

  void _showDetail(BuildContext context, BookingModel booking) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _BookingDetailSheet(
        booking: booking,
        onCancel: () async {
          Navigator.of(context).pop();
          await _doCancel(context, booking);
        },
        onReview: () {
          Navigator.of(context).pop();
          _showReviewDialog(context, booking);
        },
      ),
    );
  }

  void _showReviewDialog(BuildContext context, BookingModel booking) {
    int rating = 5;
    final commentCtrl = TextEditingController();
    final userId = ref.read(currentUserProvider)?.id;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: const Text('Leave a review'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  5,
                  (i) => IconButton(
                    icon: Icon(
                      i < rating ? Icons.star_rounded : Icons.star_border_rounded,
                      color: kWarning,
                    ),
                    onPressed: () => setState(() => rating = i + 1),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: commentCtrl,
                maxLines: 3,
                decoration: const InputDecoration(
                    hintText: 'Share your experience...'),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.of(ctx).pop();
                if (userId == null) return;
                await ref
                    .read(bookingNotifierProvider.notifier)
                    .submitReview(
                      bookingId: booking.id,
                      reviewerId: userId,
                      revieweeId: booking.terraceId,
                      rating: rating,
                      comment: commentCtrl.text,
                    );
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Review submitted!')),
                  );
                }
              },
              child: const Text('Submit'),
            ),
          ],
        ),
      ),
    );
  }
}

class _BookingCard extends StatelessWidget {
  final BookingModel booking;
  final VoidCallback onCancel;
  final VoidCallback onViewInvoice;

  const _BookingCard({
    required this.booking,
    required this.onCancel,
    required this.onViewInvoice,
  });

  Color _statusColor(BuildContext context) {
    switch (booking.status) {
      case 'ACTIVE':
        return kGreen;
      case 'CONFIRMED':
        return kPurple;
      case 'COMPLETED':
        return context.kTextSecondary;
      case 'CANCELLED':
        return kError;
      default:
        return context.kTextSecondary;
    }
  }

  String get _statusLabel {
    switch (booking.status) {
      case 'ACTIVE':
        return 'Active';
      case 'CONFIRMED':
        return 'Booked';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return booking.status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _statusColor(context);
    return Container(
      decoration: BoxDecoration(
        color: context.kSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.kBorder),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Cover image
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: booking.terraceCoverPhoto != null
                      ? CachedNetworkImage(
                          imageUrl: booking.terraceCoverPhoto!,
                          width: 80,
                          height: 80,
                          fit: BoxFit.cover,
                          errorWidget: (_, __, ___) => Container(
                              width: 80,
                              height: 80,
                              color: context.kSurfaceHigh,
                              child: Icon(Icons.landscape_outlined,
                                  color: context.kTextSecondary, size: 28)),
                        )
                      : Container(
                          width: 80,
                          height: 80,
                          color: context.kSurfaceHigh,
                          child: Icon(Icons.landscape_outlined,
                              color: context.kTextSecondary, size: 28)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: statusColor.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 6,
                                  height: 6,
                                  decoration: BoxDecoration(
                                    color: statusColor,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 5),
                                Text(
                                  _statusLabel,
                                  style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: statusColor),
                                ),
                              ],
                            ),
                          ),
                          const Spacer(),
                          if (booking.totalCharged != null)
                            Text(
                              '₹${booking.totalCharged!.toInt()}',
                              style: context.tsLabel.copyWith(color: kGreen),
                            ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        booking.terraceName ?? 'Terrace',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: context.kTextPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 5),
                      Row(
                        children: [
                          Icon(Icons.calendar_today_outlined,
                              size: 12, color: context.kTextSecondary),
                          const SizedBox(width: 4),
                          Text(
                            '${DateFormat('MMM d, yyyy').format(booking.startTime)}'
                            ' · ${DateFormat('h:mm a').format(booking.startTime)}'
                            '–${DateFormat('h:mm a').format(booking.endTime)}',
                            style: context.tsCaption,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Action buttons
          if (booking.status == 'CONFIRMED' || booking.status == 'ACTIVE') ...[
            Container(height: 1, color: context.kBorder),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: onViewInvoice,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: kPurple,
                        side: const BorderSide(color: kPurple),
                        minimumSize: const Size(0, 38),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                        padding: EdgeInsets.zero,
                      ),
                      child: Text('View Invoice',
                          style: context.tsLabelSm.copyWith(color: kPurple)),
                    ),
                  ),
                  const SizedBox(width: 10),
                  TextButton(
                    onPressed: onCancel,
                    style: TextButton.styleFrom(
                      foregroundColor: kError,
                      minimumSize: const Size(0, 38),
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8)),
                    ),
                    child: Text('Cancel',
                        style: context.tsLabelSm.copyWith(color: kError)),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _BookingDetailSheet extends StatelessWidget {
  final BookingModel booking;
  final VoidCallback onCancel;
  final VoidCallback onReview;

  const _BookingDetailSheet({
    required this.booking,
    required this.onCancel,
    required this.onReview,
  });

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.65,
      maxChildSize: 0.92,
      builder: (_, ctrl) => Container(
        decoration: BoxDecoration(
          color: context.kSurface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: ListView(
          controller: ctrl,
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                    color: context.kBorder,
                    borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 16),
            Text('Booking Details', style: context.tsTitle),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: context.kBg,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: context.kBorder),
              ),
              child: Text(
                'ID: ${booking.shortId}',
                style: TextStyle(
                  fontFamily: 'monospace',
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: context.kTextPrimary,
                ),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 16),
            _DetailRow('Terrace', booking.terraceName ?? ''),
            _DetailRow('Date',
                DateFormat('EEE, MMM d, yyyy').format(booking.startTime)),
            _DetailRow('Time',
                '${DateFormat('h:mm a').format(booking.startTime)} – ${DateFormat('h:mm a').format(booking.endTime)}'),
            _DetailRow('Guests', '${booking.guestCount}'),
            _DetailRow('Status', booking.status),
            if (booking.totalCharged != null)
              _DetailRow('Total', '₹${booking.totalCharged!.toInt()}'),
            const SizedBox(height: 24),
            if (booking.status == 'CONFIRMED')
              PrimaryButton(
                label: 'Cancel Booking',
                onPressed: onCancel,
                color: kError,
              ),
            if (booking.status == 'COMPLETED') ...[
              const SizedBox(height: 12),
              PrimaryButton(
                label: 'Leave a Review',
                onPressed: onReview,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  const _DetailRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        children: [
          SizedBox(
            width: 80,
            child: Text(label, style: context.tsCaption),
          ),
          Expanded(child: Text(value, style: context.tsBodyPrimary)),
        ],
      ),
    );
  }
}
