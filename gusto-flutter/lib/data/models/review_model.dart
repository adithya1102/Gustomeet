class ReviewModel {
  final String id;
  final String bookingId;
  final String reviewerId;
  final String revieweeId;
  final int rating;
  final String? comment;
  final String reviewType;
  final DateTime? createdAt;
  final String? reviewerName;
  final String? reviewerPhoto;

  const ReviewModel({
    required this.id,
    required this.bookingId,
    required this.reviewerId,
    required this.revieweeId,
    required this.rating,
    this.comment,
    required this.reviewType,
    this.createdAt,
    this.reviewerName,
    this.reviewerPhoto,
  });

  factory ReviewModel.fromMap(Map<String, dynamic> m) {
    final reviewer = m['reviewer'] as Map<String, dynamic>?;
    return ReviewModel(
      id: m['id'] as String,
      bookingId: m['booking_id'] as String,
      reviewerId: m['reviewer_id'] as String,
      revieweeId: m['reviewee_id'] as String,
      rating: (m['rating'] as num).toInt(),
      comment: m['comment'] as String?,
      reviewType: m['review_type'] as String? ?? 'GENERAL',
      createdAt: m['created_at'] != null ? DateTime.parse(m['created_at'] as String) : null,
      reviewerName: reviewer?['full_name'] as String?,
      reviewerPhoto: reviewer?['profile_photo_url'] as String?,
    );
  }
}
