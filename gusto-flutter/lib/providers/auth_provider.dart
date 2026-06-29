import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../data/models/user_model.dart';
import '../data/repositories/auth_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) => AuthRepository());

final firebaseUserProvider = StreamProvider<User?>((ref) {
  return FirebaseAuth.instance.authStateChanges();
});

class AuthNotifier extends StateNotifier<AsyncValue<UserModel?>> {
  final AuthRepository _repo;

  AuthNotifier(this._repo) : super(const AsyncValue.data(null));

  Future<void> loadUser() async {
    state = const AsyncValue.loading();
    try {
      final userId = await _repo.getStoredUserId();
      if (userId == null) {
        state = const AsyncValue.data(null);
        return;
      }
      final firebaseUser = FirebaseAuth.instance.currentUser;
      if (firebaseUser == null) {
        state = const AsyncValue.data(null);
        return;
      }
      final user = await _repo.upsertSupabaseUser(firebaseUser);
      state = AsyncValue.data(user);
    } catch (e, s) {
      state = AsyncValue.error(e, s);
    }
  }

  Future<void> signInWithGoogle() async {
    state = const AsyncValue.loading();
    try {
      final cred = await _repo.signInWithGoogle();
      final user = await _repo.upsertSupabaseUser(cred.user!);
      state = AsyncValue.data(user);
    } catch (e, s) {
      state = AsyncValue.error(e, s);
    }
  }

  Future<String> sendOtp(String phone) async {
    return _repo.sendOtp(phone);
  }

  Future<void> verifyOtp(String verificationId, String otp) async {
    state = const AsyncValue.loading();
    try {
      final cred = await _repo.verifyOtp(verificationId, otp);
      final user = await _repo.upsertSupabaseUser(cred.user!);
      state = AsyncValue.data(user);
    } catch (e, s) {
      state = AsyncValue.error(e, s);
    }
  }

  Future<void> signOut() async {
    await _repo.signOut();
    state = const AsyncValue.data(null);
  }

  void updateUser(UserModel user) => state = AsyncValue.data(user);
}

final authProvider =
    StateNotifierProvider<AuthNotifier, AsyncValue<UserModel?>>((ref) {
  return AuthNotifier(ref.read(authRepositoryProvider));
});

final currentUserProvider = Provider<UserModel?>((ref) {
  return ref.watch(authProvider).valueOrNull;
});
