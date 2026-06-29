import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/constants/app_text_styles.dart';
import '../../core/utils/extensions.dart';
import '../../data/repositories/user_repository.dart';
import '../../providers/auth_provider.dart';
import '../../providers/booking_provider.dart';
import '../../shared/widgets/app_bar_widget.dart';
import '../../shared/widgets/primary_button.dart';
import '../../shared/widgets/secondary_button.dart';

enum PaymentMethod { wallet, razorpay }

class BookingConfirmScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> params;
  const BookingConfirmScreen({super.key, required this.params});

  @override
  ConsumerState<BookingConfirmScreen> createState() =>
      _BookingConfirmScreenState();
}

class _BookingConfirmScreenState
    extends ConsumerState<BookingConfirmScreen> {
  bool _isCreating = false;
  PaymentMethod _paymentMethod = PaymentMethod.razorpay;

  @override
  void initState() {
    super.initState();
    // Default to wallet if user has balance, else default to Razorpay
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = ref.read(currentUserProvider);
      final total = (widget.params['totalCharged'] as num?)?.toDouble() ?? 0;
      if (user != null && user.walletBalance >= total) {
        setState(() => _paymentMethod = PaymentMethod.wallet);
      }
    });
  }

  DateTime get _start =>
      DateTime.parse(widget.params['startTime'] as String);
  DateTime get _end =>
      DateTime.parse(widget.params['endTime'] as String);

  Future<void> _confirmBooking() async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;

    final total = (widget.params['totalCharged'] as num?)?.toDouble() ?? 0;

    if (_paymentMethod == PaymentMethod.razorpay) {
      _startRazorpayPayment(total, _executeBookingCreation);
    } else {
      _executeBookingCreation();
    }
  }

  Future<void> _executeBookingCreation() async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;

    final total = (widget.params['totalCharged'] as num?)?.toDouble() ?? 0;

    setState(() => _isCreating = true);
    try {
      // 1. Process payment if paying with wallet
      if (_paymentMethod == PaymentMethod.wallet) {
        if (user.walletBalance < total) {
          throw Exception('INSUFFICIENT_FUNDS');
        }
        final newBalance = user.walletBalance - total;
        // Update balance in database
        final updatedUser = await UserRepository().updateWalletBalance(user.id, newBalance);
        // Update balance in provider state
        ref.read(authProvider.notifier).updateUser(updatedUser);
      }

      // 2. Create the booking in Supabase
      final booking =
          await ref.read(bookingNotifierProvider.notifier).createBooking(
                guestId: user.id,
                terraceId: widget.params['terraceId'] as String,
                startTime: _start,
                endTime: _end,
                purpose: widget.params['purpose'] as String,
                guestCount: widget.params['guestCount'] as int,
                ratePerUnit: widget.params['rate'] as int,
                hostId: widget.params['hostId'] as String,
              );

      if (mounted) {
        context.go('/booking/success', extra: {
          'bookingId': booking.id,
          'terraceName': widget.params['terraceName'],
          'startTime': widget.params['startTime'],
          'endTime': widget.params['endTime'],
          'total': widget.params['totalCharged'],
        });
      }
    } catch (e) {
      if (mounted) {
        String msg = e.toString();
        if (e.toString().contains('SLOT_TAKEN')) {
          msg = AppStrings.slotTaken;
        } else if (e.toString().contains('INSUFFICIENT_FUNDS')) {
          msg = 'Insufficient wallet balance. Please select another payment method.';
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg), backgroundColor: kError),
        );
        if (e.toString().contains('SLOT_TAKEN')) {
          context.pop();
        }
      }
    } finally {
      if (mounted) setState(() => _isCreating = false);
    }
  }

  void _startRazorpayPayment(double total, VoidCallback onSuccess) {
    final user = ref.read(currentUserProvider);
    final phoneCtrl = TextEditingController(text: user?.phoneNumber ?? '9876543210');
    final emailCtrl = TextEditingController(text: user?.googleEmail ?? 'user@gusto.com');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          decoration: const BoxDecoration(
            color: Color(0xFF0C192C), // Razorpay dark signature theme
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            left: 24,
            right: 24,
            top: 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0052FF),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'R',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18),
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'Razorpay Secure',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                    ],
                  ),
                  Text(
                    total.toInt().inr,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 18),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const Divider(color: Colors.white24),
              const SizedBox(height: 16),
              const Text(
                'Contact Information (For Live PG Integration Config)',
                style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: phoneCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Phone',
                  labelStyle: TextStyle(color: Colors.white60),
                  enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: emailCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Email',
                  labelStyle: TextStyle(color: Colors.white60),
                  enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Select Payment Option',
                style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.qr_code_scanner_rounded, color: Color(0xFF0052FF)),
                title: const Text('UPI (GPay, PhonePe)', style: TextStyle(color: Colors.white, fontSize: 14)),
                subtitle: const Text('Pay instantly using any UPI app', style: TextStyle(color: Colors.white60, fontSize: 11)),
                onTap: () {
                  Navigator.of(ctx).pop();
                  onSuccess();
                },
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.credit_card_rounded, color: Color(0xFF0052FF)),
                title: const Text('Cards (Visa, Mastercard, RuPay)', style: TextStyle(color: Colors.white, fontSize: 14)),
                subtitle: const Text('Debit / Credit Cards', style: TextStyle(color: Colors.white60, fontSize: 11)),
                onTap: () {
                  Navigator.of(ctx).pop();
                  onSuccess();
                },
              ),
              const SizedBox(height: 20),
              const SizedBox(
                width: double.infinity,
                child: Text(
                  'Razorpay Sandbox Mode (Simulated Success)',
                  style: TextStyle(color: Colors.orange, fontSize: 12, fontWeight: FontWeight.w600),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final total = (widget.params['totalCharged'] as num?)?.toDouble() ?? 0;
    final user = ref.watch(currentUserProvider);

    final confirmLabel = _paymentMethod == PaymentMethod.wallet
        ? 'Pay via Wallet & Confirm'
        : 'Pay via Razorpay Secure';

    return Scaffold(
      appBar: const AppBarWidget(title: 'Confirm Booking'),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _SummaryCard(
              terraceName: widget.params['terraceName'] as String? ?? '',
              cover: widget.params['terraceCover'] as String?,
              start: _start,
              end: _end,
              guestCount: widget.params['guestCount'] as int? ?? 1,
              purpose: widget.params['purpose'] as String? ?? '',
            ),
            const SizedBox(height: 24),
            
            Text('Select Payment Method', style: context.tsTitle),
            const SizedBox(height: 12),
            if (user != null) ...[
              _PaymentOption(
                icon: Icons.account_balance_wallet_outlined,
                title: 'Dummy Wallet (Gusto Wallet)',
                subtitle: 'Simulated Wallet Checkout (Balance: ${user.walletBalance.toInt().inr})',
                isSelected: _paymentMethod == PaymentMethod.wallet,
                isDisabled: false, // Never disabled so testing is never blocked
                badgeText: user.walletBalance < total ? 'Tap to Refill (Testing)' : null,
                onTap: () async {
                  if (user.walletBalance < total) {
                    try {
                      final refill = (total - user.walletBalance) + 5000.0;
                      final updated = await UserRepository().updateWalletBalance(user.id, user.walletBalance + refill);
                      ref.read(authProvider.notifier).updateUser(updated);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Dummy Wallet auto-refilled with ${refill.toInt().inr}!'),
                          backgroundColor: kGreen,
                        ),
                      );
                    } catch (e) {
                      // Offline/RLS Policy fallback
                      final refill = (total - user.walletBalance) + 5000.0;
                      final updated = user.copyWith(walletBalance: user.walletBalance + refill);
                      ref.read(authProvider.notifier).updateUser(updated);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Refilled ${refill.toInt().inr} locally (Offline Mode: $e)'),
                          backgroundColor: Colors.orange,
                        ),
                      );
                    }
                  }
                  setState(() => _paymentMethod = PaymentMethod.wallet);
                },
              ),
              const SizedBox(height: 8),
            ],
            _PaymentOption(
              icon: Icons.payment_rounded,
              title: 'Razorpay PG',
              subtitle: 'Cards, Netbanking, UPI, Wallet',
              isSelected: _paymentMethod == PaymentMethod.razorpay,
              onTap: () => setState(() => _paymentMethod = PaymentMethod.razorpay),
            ),
            
            const SizedBox(height: 24),
            PrimaryButton(
              label: confirmLabel,
              onPressed: _confirmBooking,
              isLoading: _isCreating,
            ),
            const SizedBox(height: 12),
            SecondaryButton(
              label: 'Go Back',
              onPressed: () => context.pop(),
            ),
          ],
        ),
      ),
    );
  }
}

class _PaymentOption extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool isSelected;
  final bool isDisabled;
  final String? badgeText;
  final VoidCallback onTap;

  const _PaymentOption({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.isSelected,
    this.isDisabled = false,
    this.badgeText,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: isDisabled ? null : onTap,
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? kGreen.withValues(alpha: 0.08)
              : (isDisabled ? context.kBg : context.kSurface),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? kGreen
                : (isDisabled ? context.kBorder.withValues(alpha: 0.5) : context.kBorder),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: isSelected
                    ? kGreen.withValues(alpha: 0.15)
                    : (isDisabled ? context.kBg : context.kBg),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                color: isSelected
                    ? kGreen
                    : (isDisabled ? context.kTextSecondary.withValues(alpha: 0.5) : context.kTextPrimary),
                size: 20,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                          color: isDisabled
                              ? context.kTextSecondary.withValues(alpha: 0.5)
                              : context.kTextPrimary,
                        ),
                      ),
                      if (badgeText != null) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: kError.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            badgeText!,
                            style: const TextStyle(color: kError, fontSize: 9, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: isDisabled
                          ? context.kTextSecondary.withValues(alpha: 0.3)
                          : context.kTextSecondary,
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle_rounded, color: kGreen, size: 20),
          ],
        ),
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String terraceName;
  final String? cover;
  final DateTime start;
  final DateTime end;
  final int guestCount;
  final String purpose;

  const _SummaryCard({
    required this.terraceName,
    this.cover,
    required this.start,
    required this.end,
    required this.guestCount,
    required this.purpose,
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
          _Row(Icons.house_outlined, 'Terrace', terraceName),
          _Row(
            Icons.calendar_today_outlined,
            'Date',
            DateFormat('EEE, MMM d, yyyy').format(start),
          ),
          _Row(
            Icons.access_time_outlined,
            'Time',
            '${DateFormat('h:mm a').format(start)} – ${DateFormat('h:mm a').format(end)}',
          ),
          _Row(Icons.people_outline, 'Guests', '$guestCount'),
          _Row(
            Icons.category_outlined,
            'Purpose',
            purpose.replaceAll('_', ' ').toLowerCase(),
          ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _Row(this.icon, this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 16, color: context.kTextSecondary),
          const SizedBox(width: 10),
          Text('$label: ',
              style: context.tsCaption
                  .copyWith(fontWeight: FontWeight.w500)),
          Expanded(
              child: Text(value, style: context.tsBodyPrimary)),
        ],
      ),
    );
  }
}
