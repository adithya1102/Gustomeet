import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../providers/host_provider.dart';
import '../../../shared/widgets/primary_button.dart';

const _purposeOptions = [
  ('PHOTOGRAPHY', 'Photography'),
  ('REELS_CONTENT', 'Reels / Content'),
  ('BIRTHDAY', 'Birthday'),
  ('CASUAL_HANGOUT', 'Casual Hangout'),
  ('SMALL_PARTY', 'Small Party'),
  ('SPORTS_GAMES', 'Sports / Games'),
  ('FOOD_DINING', 'Food & Dining'),
  ('CORPORATE_MEET', 'Corporate Meet'),
  ('OTHER', 'Other'),
];

class Step4Permissions extends ConsumerWidget {
  final VoidCallback onNext;
  const Step4Permissions({super.key, required this.onNext});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(hostOnboardingProvider);
    final notifier = ref.read(hostOnboardingProvider.notifier);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Rules & Permissions', style: context.tsHeadline),
          const SizedBox(height: 4),
          Text('What is and isn\'t allowed at your terrace',
              style: context.tsBody),
          const SizedBox(height: 20),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: Text('Allow alcohol', style: context.tsBodyPrimary),
            value: state.allowAlcohol,
            onChanged: (v) =>
                notifier.update((s) => s.copyWith(allowAlcohol: v)),
            activeThumbColor: kGreen,
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: Text('Allow smoking', style: context.tsBodyPrimary),
            value: state.allowSmoking,
            onChanged: (v) =>
                notifier.update((s) => s.copyWith(allowSmoking: v)),
            activeThumbColor: kGreen,
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: Text('Allow loud music (before 10PM)',
                style: context.tsBodyPrimary),
            value: state.allowLoudMusic,
            onChanged: (v) =>
                notifier.update((s) => s.copyWith(allowLoudMusic: v)),
            activeThumbColor: kGreen,
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: Text('Allow outside food', style: context.tsBodyPrimary),
            value: state.allowOutsideFood,
            onChanged: (v) =>
                notifier.update((s) => s.copyWith(allowOutsideFood: v)),
            activeThumbColor: kGreen,
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: Text('Allow couples', style: context.tsBodyPrimary),
            value: state.allowCouples,
            onChanged: (v) =>
                notifier.update((s) => s.copyWith(allowCouples: v)),
            activeThumbColor: kGreen,
          ),
          const SizedBox(height: 20),
          Text('Allowed purposes', style: context.tsTitle),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _purposeOptions.map((p) {
              final isSelected = state.allowedPurposes.contains(p.$1);
              return FilterChip(
                label: Text(p.$2),
                selected: isSelected,
                onSelected: (_) => notifier.togglePurpose(p.$1),
                selectedColor: kGreen.withValues(alpha: 0.1),
                checkmarkColor: kGreen,
                labelStyle: TextStyle(
                  color: isSelected ? kGreen : context.kTextPrimary,
                  fontWeight:
                      isSelected ? FontWeight.w600 : FontWeight.normal,
                  fontSize: 13,
                ),
                side: BorderSide(
                    color: isSelected ? kGreen : context.kBorder),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8)),
              );
            }).toList(),
          ),
          const SizedBox(height: 32),
          PrimaryButton(label: 'Continue', onPressed: onNext),
        ],
      ),
    );
  }
}
