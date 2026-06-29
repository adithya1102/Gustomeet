import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../core/utils/extensions.dart';
import '../../../core/utils/validators.dart';
import '../../../providers/host_provider.dart';
import '../../../shared/widgets/primary_button.dart';

class Step7Pricing extends ConsumerStatefulWidget {
  final VoidCallback onSubmit;
  final bool isSubmitting;

  const Step7Pricing({
    super.key,
    required this.onSubmit,
    this.isSubmitting = false,
  });

  @override
  ConsumerState<Step7Pricing> createState() => _Step7PricingState();
}

class _Step7PricingState extends ConsumerState<Step7Pricing> {
  final _formKey = GlobalKey<FormState>();
  final _rateCtrl = TextEditingController();
  final _accountCtrl = TextEditingController();
  final _ifscCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    final state = ref.read(hostOnboardingProvider);
    _rateCtrl.text = state.hourlyRate.toString();
    _accountCtrl.text = state.accountNumber;
    _ifscCtrl.text = state.ifsc;
  }

  @override
  void dispose() {
    _rateCtrl.dispose();
    _accountCtrl.dispose();
    _ifscCtrl.dispose();
    super.dispose();
  }

  int get _rate => int.tryParse(_rateCtrl.text) ?? 0;

  double get _eveningEarning => _rate * 3 * 0.82 * 1.5;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Pricing & Payout', style: AppTextStyles.headline),
            const SizedBox(height: 4),
            Text('Set your rate and bank details', style: AppTextStyles.body),
            const SizedBox(height: 24),
            Text('Your base hourly rate', style: AppTextStyles.labelMedium),
            const SizedBox(height: 8),
            TextFormField(
              controller: _rateCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(prefixText: '₹  '),
              validator: Validators.rate,
              onChanged: (_) => setState(() {
                ref.read(hostOnboardingProvider.notifier).update(
                    (s) => s.copyWith(hourlyRate: _rate));
              }),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: kGreen.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: kGreen.withValues(alpha: 0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Suggested range: ₹200–₹500/hr for Chennai',
                      style: AppTextStyles.caption),
                  const SizedBox(height: 8),
                  Text(
                    '3hr evening booking ≈ ${_eveningEarning.toInt().inr} (your earnings)',
                    style: AppTextStyles.labelMedium
                        .copyWith(color: kGreen),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Text('Bank details', style: AppTextStyles.title),
            const SizedBox(height: 4),
            Text('For payout after bookings', style: AppTextStyles.body),
            const SizedBox(height: 12),
            TextFormField(
              controller: _accountCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                  labelText: 'Account Number'),
              validator: (v) => Validators.required(v, 'Account number'),
              onChanged: (v) => ref
                  .read(hostOnboardingProvider.notifier)
                  .update((s) => s.copyWith(accountNumber: v)),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _ifscCtrl,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(labelText: 'IFSC Code'),
              validator: Validators.ifsc,
              onChanged: (v) => ref
                  .read(hostOnboardingProvider.notifier)
                  .update((s) => s.copyWith(ifsc: v.toUpperCase())),
            ),
            const SizedBox(height: 32),
            PrimaryButton(
              label: 'Submit for Review',
              isLoading: widget.isSubmitting,
              onPressed: () {
                if (_formKey.currentState!.validate()) {
                  widget.onSubmit();
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}
