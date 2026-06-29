import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../core/utils/extensions.dart';
import '../../../providers/listings_provider.dart';

class ReviewSection extends StatelessWidget {
  final List<ReviewData> reviews;

  const ReviewSection({super.key, required this.reviews});

  @override
  Widget build(BuildContext context) {
    if (reviews.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Text('No reviews yet', style: context.tsBody),
      );
    }

    final avg = reviews.map((r) => r.rating).reduce((a, b) => a + b) /
        reviews.length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.star, size: 18, color: kWarning),
            const SizedBox(width: 4),
            Text(avg.toStringAsFixed(1),
                style: context.tsTitle.copyWith(fontSize: 16)),
            const SizedBox(width: 6),
            Text('(${reviews.length} reviews)', style: context.tsBody),
          ],
        ),
        const SizedBox(height: 14),
        ...reviews.take(5).map((r) => _ReviewCard(review: r)),
      ],
    );
  }
}

class _ReviewCard extends StatelessWidget {
  final ReviewData review;
  const _ReviewCard({required this.review});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.kSurface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: kGreen.withValues(alpha: 0.1),
                backgroundImage: review.reviewerPhoto != null
                    ? CachedNetworkImageProvider(review.reviewerPhoto!)
                    : null,
                child: review.reviewerPhoto == null
                    ? Text(
                        review.reviewerName?.initials ?? '?',
                        style: const TextStyle(
                            color: kGreen,
                            fontSize: 12,
                            fontWeight: FontWeight.w600),
                      )
                    : null,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(review.reviewerName ?? 'Guest',
                        style: context.tsLabel),
                    if (review.createdAt != null)
                      Text(review.createdAt!.dateLabel,
                          style: context.tsCaption),
                  ],
                ),
              ),
              Row(
                children: List.generate(
                  5,
                  (i) => Icon(
                    i < review.rating ? Icons.star : Icons.star_border,
                    size: 14,
                    color: kWarning,
                  ),
                ),
              ),
            ],
          ),
          if (review.comment != null && review.comment!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(review.comment!, style: context.tsBody),
          ],
          if (review.reviewType == 'CREATOR') ...[
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
              decoration: BoxDecoration(
                color: kGreen.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Text('Creator',
                  style: TextStyle(
                      color: kGreen,
                      fontSize: 10,
                      fontWeight: FontWeight.w600)),
            ),
          ],
        ],
      ),
    );
  }
}
