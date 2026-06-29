import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../providers/host_provider.dart';
import '../../../shared/widgets/primary_button.dart';

const _sections = [
  ('Seating & Comfort', [
    ('seating_area', 'Seating Area'),
    ('shade_awning', 'Shade / Awning'),
    ('outdoor_furniture', 'Outdoor Furniture'),
  ]),
  ('Ambience', [
    ('fairy_lights', 'Fairy Lights'),
    ('garden_plants', 'Garden / Plants'),
    ('backdrop', 'Aesthetic Wall / Backdrop'),
  ]),
  ('Utilities', [
    ('power_outlets', 'Power Outlets'),
    ('drinking_water', 'Drinking Water'),
    ('washroom', 'Washroom'),
    ('wifi', 'WiFi'),
  ]),
  ('Entertainment', [
    ('sound_system', 'Sound System'),
    ('board_games', 'Board Games'),
    ('sports_equipment', 'Sports Equipment'),
  ]),
  ('Practical', [
    ('parking', 'Parking Available'),
  ]),
];

class Step3Amenities extends ConsumerWidget {
  final VoidCallback onNext;
  const Step3Amenities({super.key, required this.onNext});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(hostOnboardingProvider);
    final notifier = ref.read(hostOnboardingProvider.notifier);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Amenities', style: AppTextStyles.headline),
          const SizedBox(height: 4),
          Text('What does your terrace offer?', style: AppTextStyles.body),
          const SizedBox(height: 20),
          ..._sections.map((section) => Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(section.$1,
                      style: AppTextStyles.labelMedium
                          .copyWith(fontSize: 12)),
                  const SizedBox(height: 8),
                  ...section.$2.map(
                    (item) => CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(item.$2,
                          style: AppTextStyles.bodyPrimary),
                      value: state.amenities[item.$1] ?? false,
                      onChanged: (v) =>
                          notifier.toggleAmenity(item.$1, v ?? false),
                      activeColor: const Color(0xFF10B981),
                      controlAffinity: ListTileControlAffinity.leading,
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
              )),
          const SizedBox(height: 24),
          PrimaryButton(label: 'Continue', onPressed: onNext),
        ],
      ),
    );
  }
}
