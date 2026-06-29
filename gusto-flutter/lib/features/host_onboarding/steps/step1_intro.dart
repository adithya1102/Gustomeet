import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../shared/widgets/primary_button.dart';

class Step1Intro extends StatelessWidget {
  final VoidCallback onNext;
  const Step1Intro({super.key, required this.onNext});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 16),
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: kGreen.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(Icons.house_outlined, color: kGreen, size: 40),
          ),
          const SizedBox(height: 24),
          Text('Start earning from\nyour terrace',
              style: AppTextStyles.display),
          const SizedBox(height: 8),
          Text('Turn your unused space into passive income',
              style: AppTextStyles.body),
          const SizedBox(height: 32),
          ...[
            ('📋', 'List your space',
                'Fill out details about your terrace in 7 steps'),
            ('🏠', 'We verify & photograph',
                'Our team visits to verify and capture your space professionally'),
            ('💰', 'Earn passively',
                'Get paid for every booking while you relax'),
          ].map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.$1, style: const TextStyle(fontSize: 24)),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(item.$2,
                            style: AppTextStyles.labelMedium),
                        const SizedBox(height: 2),
                        Text(item.$3, style: AppTextStyles.caption),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const Spacer(),
          PrimaryButton(
            label: 'Get Started',
            onPressed: onNext,
          ),
        ],
      ),
    );
  }
}
