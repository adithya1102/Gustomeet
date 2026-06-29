import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../providers/host_provider.dart';
import '../../../shared/widgets/primary_button.dart';

const _checklistItems = [
  'Parapet wall or railing ≥ 3.5 feet high',
  'No broken / loose railing sections',
  'Staircase to terrace has functional lighting',
  'No exposed electrical wiring on terrace',
  'Floor free of large cracks or trip hazards',
  'I am sole owner OR have written consent from all co-occupants',
];

class Step5SafetyChecklist extends ConsumerWidget {
  final VoidCallback onNext;
  const Step5SafetyChecklist({super.key, required this.onNext});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(hostOnboardingProvider);
    final notifier = ref.read(hostOnboardingProvider.notifier);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Safety Checklist', style: context.tsHeadline),
          const SizedBox(height: 4),
          Text('All items must be confirmed to proceed',
              style: context.tsBody),
          const SizedBox(height: 20),
          ...List.generate(
            _checklistItems.length,
            (i) => CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(_checklistItems[i],
                  style: context.tsBodyPrimary.copyWith(fontSize: 13)),
              value: state.safetyChecklist[i],
              onChanged: (v) => notifier.setSafetyItem(i, v ?? false),
              activeColor: kGreen,
              controlAffinity: ListTileControlAffinity.leading,
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: kGreen.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: kGreen.withValues(alpha: 0.2)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.info_outline, color: kGreen, size: 18),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Our team visits before listing goes live. This creates a safety record.',
                    style: context.tsCaption
                        .copyWith(color: context.kTextPrimary),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          PrimaryButton(
            label: 'Continue',
            onPressed: state.safetyAllChecked ? onNext : null,
          ),
        ],
      ),
    );
  }
}
