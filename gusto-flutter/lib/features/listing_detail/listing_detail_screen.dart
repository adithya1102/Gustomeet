import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show Clipboard, ClipboardData;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../core/utils/extensions.dart';
import '../../data/models/terrace_model.dart';
import '../../providers/listings_provider.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/loading_shimmer.dart';
import '../../shared/widgets/primary_button.dart';
import '../chat/chat_screen.dart';
import 'widgets/photo_carousel.dart';
import 'widgets/amenity_chips.dart';
import 'widgets/light_window_card.dart';
import 'widgets/booking_calendar.dart';
import 'widgets/review_section.dart';

class ListingDetailScreen extends ConsumerStatefulWidget {
  final String terraceId;
  const ListingDetailScreen({super.key, required this.terraceId});

  @override
  ConsumerState<ListingDetailScreen> createState() =>
      _ListingDetailScreenState();
}

class _ListingDetailScreenState extends ConsumerState<ListingDetailScreen> {
  RealtimeChannel? _slotsChannel;
  SlotState? _selectedSlot;

  @override
  void initState() {
    super.initState();
    _slotsChannel = Supabase.instance.client
        .channel('terrace-slots-${widget.terraceId}')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'slot_holds',
          filter: PostgresChangeFilter(
              type: PostgresChangeFilterType.eq,
              column: 'terrace_id',
              value: widget.terraceId),
          callback: (_) => ref.invalidate(
              availableSlotsProvider(SlotQuery(
                  terraceId: widget.terraceId,
                  date: ref.read(
                      selectedDateProvider(widget.terraceId))))),
        )
        .subscribe();
  }

  @override
  void dispose() {
    _slotsChannel?.unsubscribe();
    super.dispose();
  }

  double _multiplier(int hour) {
    if (hour >= 16 && hour < 20) return 1.5;
    if (hour >= 7 && hour < 11) return 0.8;
    if (hour >= 20) return 1.2;
    return 1.0;
  }

  @override
  Widget build(BuildContext context) {
    final terraceAsync = ref.watch(terraceDetailProvider(widget.terraceId));
    final selectedDate = ref.watch(selectedDateProvider(widget.terraceId));
    final slotsAsync = ref.watch(availableSlotsProvider(
        SlotQuery(terraceId: widget.terraceId, date: selectedDate)));
    final reviewsAsync = ref.watch(terraceReviewsProvider(widget.terraceId));

    return Scaffold(
      backgroundColor: context.kBg,
      body: terraceAsync.when(
        loading: () =>
            const Center(child: CircularProgressIndicator(color: kGreen)),
        error: (e, _) => ErrorState(
          message: 'Failed to load terrace',
          onRetry: () =>
              ref.invalidate(terraceDetailProvider(widget.terraceId)),
        ),
        data: (terrace) => _Body(
          terrace: terrace,
          selectedDate: selectedDate,
          slotsAsync: slotsAsync,
          reviewsAsync: reviewsAsync,
          selectedSlot: _selectedSlot,
          onDateSelected: (d) {
            ref
                .read(selectedDateProvider(widget.terraceId).notifier)
                .state = d;
            setState(() => _selectedSlot = null);
          },
          onSlotSelected: (s) => setState(() => _selectedSlot = s),
          multiplier: _multiplier,
          onBook: () {
            if (_selectedSlot == null) return;
            context.push('/booking/flow', extra: {
              'terraceId': terrace.id,
              'terraceName': terrace.title,
              'terraceCover': terrace.coverPhoto,
              'hostId': terrace.hostId,
              'startTime': _selectedSlot!.start.toIso8601String(),
              'endTime': _selectedSlot!.end.toIso8601String(),
              'rate': terrace.hourlyRate?.rate ?? 0,
              'maxCapacity': terrace.maxCapacity,
            });
          },
        ),
      ),
    );
  }
}

class _Body extends ConsumerWidget {
  final TerraceModel terrace;
  final DateTime selectedDate;
  final AsyncValue<List<SlotState>> slotsAsync;
  final AsyncValue<List<ReviewData>> reviewsAsync;
  final SlotState? selectedSlot;
  final ValueChanged<DateTime> onDateSelected;
  final ValueChanged<SlotState?> onSlotSelected;
  final double Function(int) multiplier;
  final VoidCallback onBook;

  const _Body({
    required this.terrace,
    required this.selectedDate,
    required this.slotsAsync,
    required this.reviewsAsync,
    required this.selectedSlot,
    required this.onDateSelected,
    required this.onSlotSelected,
    required this.multiplier,
    required this.onBook,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rate = terrace.hourlyRate?.rate ?? 0;
    final selectedDuration = ref.watch(selectedDurationProvider(terrace.id));

    double timeCost = 0.0;
    double mult = 1.0;
    if (selectedSlot != null) {
      mult = multiplier(selectedSlot!.start.hour);
      timeCost = rate * selectedDuration * mult;
    }
    const cleaning = 150.0;
    const utility = 50.0;
    const deposit = 500.0;
    final subtotal = timeCost + cleaning + utility;
    final platformFee = selectedSlot != null ? (subtotal * 0.18).round().toDouble() : 0.0;
    final total = selectedSlot != null ? subtotal + platformFee + deposit : 0.0;

    return Stack(
      children: [
        CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 300,
              pinned: true,
              backgroundColor: context.kSurface,
              leading: Padding(
                padding: const EdgeInsets.all(8),
                child: GestureDetector(
                  onTap: () => context.pop(),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.35),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.arrow_back_ios_new_rounded,
                        size: 16, color: Colors.white),
                  ),
                ),
              ),
              actions: [
                GestureDetector(
                  onTap: () {
                    final link = 'https://meetv1.gusto.com/listing/${terrace.id}';
                    Clipboard.setData(ClipboardData(text: link));
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: const Row(
                          children: [
                            Icon(Icons.check_circle_outline, color: Colors.white),
                            SizedBox(width: 8),
                            Text('Listing link copied to clipboard!', style: TextStyle(color: Colors.white)),
                          ],
                        ),
                        backgroundColor: kGreen,
                        duration: const Duration(seconds: 2),
                      ),
                    );
                  },
                  child: Padding(
                    padding: const EdgeInsets.all(8),
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.35),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.share_outlined,
                          size: 16, color: Colors.white),
                    ),
                  ),
                ),
              ],
              flexibleSpace: FlexibleSpaceBar(
                background: PhotoCarousel(
                  key: ValueKey('photo_carousel_${terrace.id}'),
                  photos: terrace.allPhotos,
                  creatorReady: terrace.creatorReady,
                ),
              ),
            ),

            // Info section
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (terrace.creatorReady)
                      Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: kPurple.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                              color: kPurple.withValues(alpha: 0.25)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.verified_outlined,
                                size: 13, color: kPurple),
                            const SizedBox(width: 5),
                            Text('Creator Ready',
                                style: context.tsLabelSm
                                    .copyWith(color: kPurple)),
                          ],
                        ),
                      ),

                    Text(terrace.title, style: context.tsHeadline),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(Icons.location_on_outlined,
                            size: 14, color: context.kTextSecondary),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            [
                              terrace.area,
                              if (terrace.floorLevel != null)
                                'Floor ${terrace.floorLevel}',
                              if (terrace.terraceDirection != null)
                                terrace.terraceDirection,
                            ].whereType<String>().join(' · '),
                            style: context.tsBody,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.star_rounded,
                                size: 15, color: kWarning),
                            const SizedBox(width: 3),
                            Text('4.9', style: context.tsBodyPrimary),
                          ],
                        ),
                        const SizedBox(width: 16),
                        Row(
                          children: [
                            Icon(Icons.people_outline,
                                size: 14, color: context.kTextSecondary),
                            const SizedBox(width: 4),
                            Text('Up to ${terrace.maxCapacity}',
                                style: context.tsBody),
                          ],
                        ),
                        const Spacer(),
                        Text(
                          'Starts from ${rate.inr}/hr',
                          style: context.tsLabel.copyWith(color: kGreen),
                        ),
                      ],
                    ),

                    const SizedBox(height: 20),
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 18,
                          backgroundColor: kGreen.withValues(alpha: 0.15),
                          child: const Icon(Icons.person, color: kGreen, size: 18),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Host', style: context.tsCaption),
                            Text('Terrace Owner', style: context.tsBodyPrimary.copyWith(fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const Spacer(),
                        ElevatedButton.icon(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => ChatScreen(
                                  receiverId: terrace.hostId,
                                  receiverName: 'Host of ${terrace.title}',
                                ),
                              ),
                            );
                          },
                          icon: const Icon(Icons.chat_bubble_outline_rounded, size: 14),
                          label: const Text('Message Host'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: kGreen.withValues(alpha: 0.1),
                            foregroundColor: kGreen,
                            elevation: 0,
                            minimumSize: const Size(0, 32),
                            side: const BorderSide(color: kGreen),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            textStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 20),
                    Divider(color: context.kBorder, height: 1),
                    const SizedBox(height: 20),

                    // Date / Time pickers row
                    Row(
                      children: [
                        Expanded(
                          child: _PickerField(
                            icon: Icons.calendar_today_outlined,
                            label: 'Date',
                            value: _fmtDate(selectedDate),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _PickerField(
                            icon: Icons.access_time_outlined,
                            label: 'Time',
                            value: selectedSlot != null
                                ? '${_fmt(selectedSlot!.start)}–${_fmt(selectedSlot!.end)}'
                                : 'Select slot',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Divider(color: context.kBorder, height: 1),
                    const SizedBox(height: 20),

                    Text('Description', style: context.tsTitle),
                    const SizedBox(height: 8),
                    Text(
                      terrace.description ?? 'A beautiful rooftop space perfect for shoots, meets, and private get-togethers. Enjoy stunning views, complete privacy, and premium amenities tailored for creative professionals.',
                      style: context.tsBody,
                    ),

                    const SizedBox(height: 20),
                    Divider(color: context.kBorder, height: 1),
                    const SizedBox(height: 20),

                    Text('Amenities', style: context.tsTitle),
                    const SizedBox(height: 12),
                    AmenityChips(terrace: terrace),

                    if (terrace.creatorReady &&
                        terrace.lightData != null) ...[
                      const SizedBox(height: 16),
                      LightWindowCard(lightData: terrace.lightData!),
                    ],

                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: () {
                          final items = <String>[];
                          if (terrace.permissions?.allowCouples == true) items.add('Couples OK');
                          if (terrace.permissions?.allowOutsideFood == true) items.add('Outside food');
                          if (terrace.permissions?.allowLoudMusic == true) items.add('Music OK');
                          if (terrace.noiseEnvironment != null) {
                            items.add(terrace.noiseEnvironment!.replaceAll('_', ' '));
                          }
                          items.addAll(
                            terrace.permissions?.allowedPurposes
                                    .map((p) => p.replaceAll('_', ' ')) ??
                                [],
                          );

                          showModalBottomSheet(
                            context: context,
                            backgroundColor: Colors.transparent,
                            builder: (ctx) => Container(
                              decoration: BoxDecoration(
                                color: ctx.kSurface,
                                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                              ),
                              padding: const EdgeInsets.all(24),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Center(
                                    child: Container(
                                      width: 36,
                                      height: 4,
                                      decoration: BoxDecoration(
                                          color: ctx.kBorder,
                                          borderRadius: BorderRadius.circular(2)),
                                    ),
                                  ),
                                  const SizedBox(height: 20),
                                  Text('All Amenities & Rules', style: ctx.tsTitle),
                                  const SizedBox(height: 16),
                                  Expanded(
                                    child: items.isEmpty
                                        ? Center(child: Text('No amenities listed', style: ctx.tsBody))
                                        : ListView(
                                            children: items.map((amenity) {
                                              return Padding(
                                                padding: const EdgeInsets.symmetric(vertical: 8),
                                                child: Row(
                                                  children: [
                                                    const Icon(Icons.check_circle_outline_rounded, color: kGreen, size: 20),
                                                    const SizedBox(width: 12),
                                                    Text(
                                                      amenity.toUpperCase(),
                                                      style: ctx.tsBodyPrimary,
                                                    ),
                                                  ],
                                                ),
                                              );
                                            }).toList(),
                                          ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: context.kTextPrimary,
                          side: BorderSide(color: context.kBorder),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10)),
                          padding:
                              const EdgeInsets.symmetric(vertical: 12),
                        ),
                        child: Text('Show all amenities',
                            style: context.tsBodyPrimary),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            SliverToBoxAdapter(
              child: BookingCalendar(
                selectedDate: selectedDate,
                onDateSelected: onDateSelected,
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 20)),

            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Select Duration', style: context.tsTitle),
                    const SizedBox(height: 10),
                    Row(
                      children: [1, 2, 3, 4, 6].map((hours) {
                        final isSelected = selectedDuration == hours;
                        return GestureDetector(
                          onTap: () {
                            ref.read(selectedDurationProvider(terrace.id).notifier).state = hours;
                            onSlotSelected(null);
                          },
                          child: Container(
                            margin: const EdgeInsets.only(right: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: isSelected ? kGreen.withValues(alpha: 0.15) : context.kSurface,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: isSelected ? kGreen : context.kBorder),
                            ),
                            child: Text(
                              '$hours ${hours == 1 ? 'Hour' : 'Hours'}',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                                color: isSelected ? kGreen : context.kTextPrimary,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 20)),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Text('Available slots', style: context.tsTitle),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 12)),
            SliverToBoxAdapter(
              child: slotsAsync.when(
                loading: () => const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20),
                  child: LoadingShimmer(height: 120),
                ),
                error: (e, _) => Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Text('Failed to load slots',
                      style: context.tsBody),
                ),
                data: (slots) => Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: slots.map((s) {
                      final isSelected = selectedSlot?.start == s.start;
                      final label =
                          '${_fmt(s.start)}–${_fmt(s.end)}';
                      Color bg, fg, border;

                      switch (s.status) {
                        case SlotStatus.available:
                          bg = isSelected
                              ? kGreen
                              : kGreen.withValues(alpha: 0.1);
                          fg = isSelected ? kOnPrimary : kGreen;
                          border = isSelected ? kGreen : kGreen.withValues(alpha: 0.35);
                        case SlotStatus.booked || SlotStatus.buffer:
                          bg = kError.withValues(alpha: 0.1);
                          fg = kError;
                          border = kError.withValues(alpha: 0.3);
                        case SlotStatus.active:
                          bg = kWarning.withValues(alpha: 0.1);
                          fg = kWarning;
                          border = kWarning.withValues(alpha: 0.3);
                        case SlotStatus.cutoff:
                          bg = context.kSurface;
                          fg = context.kTextSecondary;
                          border = context.kBorder;
                      }

                      return GestureDetector(
                        onTap: s.status == SlotStatus.available
                            ? () => onSlotSelected(s)
                            : null,
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 9),
                          decoration: BoxDecoration(
                            color: bg,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: border),
                          ),
                          child: Text(label,
                              style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                  color: fg)),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
            ),

            if (selectedSlot != null)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                  child: _PricingCard(
                    timeCost: timeCost.round(),
                    mult: mult,
                    cleaning: cleaning.round(),
                    utility: utility.round(),
                    deposit: deposit.round(),
                    platformFee: platformFee.round(),
                    total: total.round(),
                  ),
                ),
              ),

            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('House rules', style: context.tsTitle),
                    const SizedBox(height: 12),
                    if (terrace.permissions != null)
                      _RulesCard(permissions: terrace.permissions!),
                    const SizedBox(height: 24),
                    Text('Reviews', style: context.tsTitle),
                    const SizedBox(height: 12),
                    reviewsAsync.when(
                      loading: () => const LoadingShimmer(height: 80),
                      error: (_, __) =>
                          Text('Failed to load reviews',
                              style: context.tsBody),
                      data: (reviews) => ReviewSection(reviews: reviews),
                    ),
                    const SizedBox(height: 100),
                  ],
                ),
              ),
            ),
          ],
        ),

        // Bottom sticky bar
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: Container(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
            decoration: BoxDecoration(
              color: context.kSurface,
              border: Border(top: BorderSide(color: context.kBorder)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.4),
                  blurRadius: 20,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: Row(
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('Total Price', style: context.tsCaption),
                    Text(
                      selectedSlot != null ? total.toInt().inr : '${rate.inr}/hr',
                      style: context.tsTitle,
                    ),
                    if (selectedSlot != null)
                      Text('incl. fees & deposit',
                          style: context.tsCaption),
                  ],
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: PrimaryButton(
                    label: selectedSlot != null ? 'Book Now' : 'Select a slot',
                    onPressed: selectedSlot != null ? onBook : null,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  String _fmtDate(DateTime d) {
    const months = [
      '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[d.month]} ${d.day}, ${d.year}';
  }

  String _fmt(DateTime dt) {
    final h = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
    final period = dt.hour < 12 ? 'AM' : 'PM';
    return '$h:00 $period';
  }
}

class _PickerField extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _PickerField({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: context.kBg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: context.kBorder),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: kGreen),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: context.tsCaption
                        .copyWith(fontSize: 10, letterSpacing: 0.5)),
                const SizedBox(height: 2),
                Text(value,
                    style: context.tsBodyPrimary.copyWith(fontSize: 13),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PricingCard extends StatelessWidget {
  final int timeCost;
  final double mult;
  final int cleaning;
  final int utility;
  final int deposit;
  final int platformFee;
  final int total;

  const _PricingCard({
    required this.timeCost,
    required this.mult,
    required this.cleaning,
    required this.utility,
    required this.deposit,
    required this.platformFee,
    required this.total,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.kSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.kBorder),
      ),
      child: Column(
        children: [
          _PRow(
              'Base (2hrs${mult != 1.0 ? " × ${mult}x" : ""})',
              timeCost.inr),
          _PRow('Cleaning fee', cleaning.inr),
          _PRow('Utility fee', utility.inr),
          _PRow('Platform fee (18%)', platformFee.inr),
          Divider(color: context.kBorder, height: 20),
          _PRow('Security deposit', deposit.inr, isNote: true),
          Divider(color: context.kBorder, height: 20),
          _PRow('Total', total.inr, isBold: true),
          const SizedBox(height: 8),
          Text(
            'Deposit returned 24hrs after booking ends',
            style: context.tsCaption,
          ),
        ],
      ),
    );
  }
}

class _PRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isBold;
  final bool isNote;

  const _PRow(this.label, this.value,
      {this.isBold = false, this.isNote = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              color: isNote ? context.kTextSecondary : context.kTextPrimary,
              fontWeight: isBold ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              color: context.kTextPrimary,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }
}

class _RulesCard extends StatelessWidget {
  final TerracePermissionsModel permissions;
  const _RulesCard({required this.permissions});

  @override
  Widget build(BuildContext context) {
    final rules = <_Rule>[
      _Rule(Icons.liquor_outlined, 'Alcohol', permissions.allowAlcohol),
      _Rule(Icons.smoking_rooms_outlined, 'Smoking', permissions.allowSmoking),
      _Rule(Icons.music_note_outlined, 'Loud music',
          permissions.allowLoudMusic),
      _Rule(Icons.lunch_dining_outlined, 'Outside food',
          permissions.allowOutsideFood),
      _Rule(Icons.favorite_outline, 'Couples', permissions.allowCouples),
    ];

    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: rules.map((r) => _RuleChip(rule: r)).toList(),
    );
  }
}

class _Rule {
  final IconData icon;
  final String label;
  final bool allowed;
  _Rule(this.icon, this.label, this.allowed);
}

class _RuleChip extends StatelessWidget {
  final _Rule rule;
  const _RuleChip({required this.rule});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: rule.allowed
            ? kGreen.withValues(alpha: 0.1)
            : kError.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
            color: rule.allowed
                ? kGreen.withValues(alpha: 0.35)
                : kError.withValues(alpha: 0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(rule.icon,
              size: 14, color: rule.allowed ? kGreen : kError),
          const SizedBox(width: 5),
          Text(rule.label,
              style: TextStyle(
                  fontSize: 12,
                  color: rule.allowed ? kGreen : kError)),
          const SizedBox(width: 5),
          Icon(
            rule.allowed
                ? Icons.check_circle_outline
                : Icons.cancel_outlined,
            size: 12,
            color: rule.allowed ? kGreen : kError,
          ),
        ],
      ),
    );
  }
}
