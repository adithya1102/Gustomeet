import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/booking_model.dart';
import '../data/repositories/booking_repository.dart';
import 'auth_provider.dart';

final bookingRepositoryProvider =
    Provider<BookingRepository>((ref) => BookingRepository());

final userBookingsProvider =
    FutureProvider<List<BookingModel>>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return [];
  final repo = ref.read(bookingRepositoryProvider);
  return repo.getUserBookings(user.id);
});

class BookingNotifier extends StateNotifier<AsyncValue<BookingModel?>> {
  final BookingRepository _repo;

  BookingNotifier(this._repo) : super(const AsyncValue.data(null));

  Future<BookingModel> createBooking({
    required String guestId,
    required String terraceId,
    required DateTime startTime,
    required DateTime endTime,
    required String purpose,
    required int guestCount,
    required int ratePerUnit,
    required String hostId,
  }) async {
    state = const AsyncValue.loading();
    try {
      final booking = await _repo.createBooking(
        guestId: guestId,
        terraceId: terraceId,
        startTime: startTime,
        endTime: endTime,
        purpose: purpose,
        guestCount: guestCount,
        ratePerUnit: ratePerUnit,
        hostId: hostId,
      );
      state = AsyncValue.data(booking);
      return booking;
    } catch (e, s) {
      state = AsyncValue.error(e, s);
      rethrow;
    }
  }

  Future<void> cancelBooking(String bookingId) async {
    await _repo.cancelBooking(bookingId);
  }

  Future<void> submitReview({
    required String bookingId,
    required String reviewerId,
    required String revieweeId,
    required int rating,
    required String comment,
  }) async {
    await _repo.submitReview(
      bookingId: bookingId,
      reviewerId: reviewerId,
      revieweeId: revieweeId,
      rating: rating,
      comment: comment,
    );
  }
}

final bookingNotifierProvider =
    StateNotifierProvider<BookingNotifier, AsyncValue<BookingModel?>>((ref) {
  return BookingNotifier(ref.read(bookingRepositoryProvider));
});
