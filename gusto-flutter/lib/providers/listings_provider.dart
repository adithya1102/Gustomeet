import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/terrace_model.dart';
import '../data/repositories/terrace_repository.dart';

final terraceRepositoryProvider =
    Provider<TerraceRepository>((ref) => TerraceRepository());

final selectedPurposeProvider = StateProvider<String?>((ref) => null);
final selectedCityProvider = StateProvider<String?>((ref) => null); // null means All Cities

final listingsProvider =
    FutureProvider.family<List<TerraceModel>, String?>((ref, purpose) async {
  final repo = ref.read(terraceRepositoryProvider);
  return repo.getListings(purpose: purpose);
});

// Dynamically extracts available cities from the active listings
final availableCitiesProvider = Provider<List<String>>((ref) {
  final listingsAsync = ref.watch(listingsProvider(null));
  return listingsAsync.maybeWhen(
    data: (listings) {
      final cities = listings.map((t) => t.city).where((c) => c.isNotEmpty).toSet().toList();
      cities.sort();
      return cities;
    },
    orElse: () => const [],
  );
});

final terraceDetailProvider =
    FutureProvider.family<TerraceModel, String>((ref, terraceId) async {
  final repo = ref.read(terraceRepositoryProvider);
  return repo.getTerrace(terraceId);
});

final terraceReviewsProvider =
    FutureProvider.family<List<ReviewData>, String>((ref, terraceId) async {
  final repo = ref.read(terraceRepositoryProvider);
  final reviews = await repo.getReviews(terraceId);
  return reviews.map((r) => ReviewData(
    reviewerName: r.reviewerName,
    reviewerPhoto: r.reviewerPhoto,
    rating: r.rating,
    comment: r.comment,
    reviewType: r.reviewType,
    createdAt: r.createdAt,
  )).toList();
});

class ReviewData {
  final String? reviewerName;
  final String? reviewerPhoto;
  final int rating;
  final String? comment;
  final String reviewType;
  final DateTime? createdAt;

  ReviewData({
    this.reviewerName,
    this.reviewerPhoto,
    required this.rating,
    this.comment,
    required this.reviewType,
    this.createdAt,
  });
}

final selectedDateProvider = StateProvider.family<DateTime, String>((ref, _) => DateTime.now());

final selectedDurationProvider = StateProvider.family<int, String>((ref, terraceId) => 2);

final availableSlotsProvider =
    FutureProvider.family<List<SlotState>, SlotQuery>((ref, query) async {
  final repo = ref.read(terraceRepositoryProvider);
  final durationHours = ref.watch(selectedDurationProvider(query.terraceId));
  final bookings = await repo.getBookingsForDate(query.terraceId, query.date);
  final holds = await repo.getActiveSlotHolds(query.terraceId);

  final slots = <SlotState>[];
  final now = DateTime.now();

  for (int hour = 7; hour <= 22 - durationHours; hour += 1) {
    final slotStart = DateTime(
        query.date.year, query.date.month, query.date.day, hour);
    final slotEnd = slotStart.add(Duration(hours: durationHours));

    if (slotStart.isBefore(now.add(const Duration(hours: 3)))) {
      slots.add(SlotState(start: slotStart, end: slotEnd, status: SlotStatus.cutoff));
      continue;
    }

    bool isBooked = false;
    bool isBuffer = false;
    bool isHeld = false;

    for (final b in bookings) {
      final bStart = DateTime.parse(b['start_time'] as String);
      final bEnd = DateTime.parse(b['end_time'] as String);
      final bufferEnd = bEnd.add(const Duration(minutes: 45));

      if (_overlaps(slotStart, slotEnd, bStart, bEnd)) {
        isBooked = true;
        break;
      }
      if (_overlaps(slotStart, slotEnd, bStart, bufferEnd)) {
        isBuffer = true;
      }
    }

    if (!isBooked) {
      for (final h in holds) {
        final hStart = DateTime.parse(h['start_time'] as String);
        final hEnd = DateTime.parse(h['end_time'] as String);
        if (_overlaps(slotStart, slotEnd, hStart, hEnd)) {
          isHeld = true;
          break;
        }
      }
    }

    final status = isBooked
        ? SlotStatus.booked
        : isBuffer
            ? SlotStatus.buffer
            : isHeld
                ? SlotStatus.active
                : SlotStatus.available;

    slots.add(SlotState(start: slotStart, end: slotEnd, status: status));
  }

  return slots;
});

bool _overlaps(DateTime s1, DateTime e1, DateTime s2, DateTime e2) {
  return s1.isBefore(e2) && e1.isAfter(s2);
}

class SlotQuery {
  final String terraceId;
  final DateTime date;
  SlotQuery({required this.terraceId, required this.date});

  @override
  bool operator ==(Object other) =>
      other is SlotQuery &&
      other.terraceId == terraceId &&
      other.date.day == date.day &&
      other.date.month == date.month &&
      other.date.year == date.year;

  @override
  int get hashCode => Object.hash(terraceId, date.year, date.month, date.day);
}

enum SlotStatus { available, booked, buffer, active, cutoff }

class SlotState {
  final DateTime start;
  final DateTime end;
  final SlotStatus status;
  SlotState({required this.start, required this.end, required this.status});
}
