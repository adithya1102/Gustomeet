import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/constants/app_text_styles.dart';
import '../../core/utils/extensions.dart';
import '../../shared/widgets/primary_button.dart';
import '../../shared/widgets/secondary_button.dart';

class BookingSuccessScreen extends StatelessWidget {
  final Map<String, dynamic> params;
  const BookingSuccessScreen({super.key, required this.params});

  @override
  Widget build(BuildContext context) {
    final bookingId = params['bookingId'] as String? ?? '';
    final terraceName = params['terraceName'] as String? ?? '';
    final startTime = params['startTime'] != null
        ? DateTime.parse(params['startTime'] as String)
        : DateTime.now();
    final endTime = params['endTime'] != null
        ? DateTime.parse(params['endTime'] as String)
        : DateTime.now();
    return Scaffold(
      backgroundColor: context.kBg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),
              _AnimatedCheck(),
              const SizedBox(height: 24),
              Text(AppStrings.bookingSuccess,
                  style: context.tsDisplay, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              Text('Your spot is reserved!',
                  style: context.tsBody, textAlign: TextAlign.center),
              const SizedBox(height: 28),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: context.kSurface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: context.kBorder),
                ),
                child: Column(
                  children: [
                    _Detail(Icons.house_outlined, terraceName),
                    const SizedBox(height: 8),
                    _Detail(
                      Icons.calendar_today_outlined,
                      DateFormat('EEE, MMM d, yyyy').format(startTime),
                    ),
                    const SizedBox(height: 8),
                    _Detail(
                      Icons.access_time_outlined,
                      '${DateFormat('h:mm a').format(startTime)} – ${DateFormat('h:mm a').format(endTime)}',
                    ),
                    Divider(color: context.kBorder, height: 20),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: context.kBg,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: context.kBorder),
                      ),
                      child: Text(
                        'Booking ID: ${bookingId.substring(0, 8).toUpperCase()}',
                        style: TextStyle(
                          fontFamily: 'monospace',
                          fontSize: 13,
                          color: context.kTextPrimary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: kWarning.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: kWarning.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.payments_outlined,
                        color: kWarning, size: 18),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        '${500.inr} deposit + remaining to be paid at venue',
                        style: context.tsCaption.copyWith(
                            color: context.kTextPrimary),
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              PrimaryButton(
                label: 'View My Booking',
                onPressed: () => context.go('/bookings'),
              ),
              const SizedBox(height: 12),
              SecondaryButton(
                label: 'Back to Home',
                onPressed: () => context.go('/home'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AnimatedCheck extends StatefulWidget {
  @override
  State<_AnimatedCheck> createState() => _AnimatedCheckState();
}

class _AnimatedCheckState extends State<_AnimatedCheck>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600));
    _scale = CurvedAnimation(parent: _ctrl, curve: Curves.elasticOut);
    _ctrl.forward();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scale,
      child: Container(
        width: 96,
        height: 96,
        decoration: const BoxDecoration(
            color: kGreen, shape: BoxShape.circle),
        child: const Icon(Icons.check, color: kOnPrimary, size: 52),
      ),
    );
  }
}

class _Detail extends StatelessWidget {
  final IconData icon;
  final String text;
  const _Detail(this.icon, this.text);

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: context.kTextSecondary),
        const SizedBox(width: 10),
        Expanded(child: Text(text, style: context.tsBodyPrimary)),
      ],
    );
  }
}
