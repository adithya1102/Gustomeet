import 'dart:async';
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
  late final StreamSubscription<User?> _authSub;

  AuthNotifier(this._repo) : super(const AsyncValue.data(null)) {
    _authSub = FirebaseAuth.instance
        .authStateChanges()
        .listen(_onAuthStateChanged);
  }

  Future<void> _onAuthStateChanged(User? user) async {
    if (user == null) {
      state = const AsyncValue.data(null);
      return;
    }
    state = const AsyncValue.loading();
    try {
      final userModel = await _repo.upsertSupabaseUser(user);
      state = AsyncValue.data(userModel);
    } catch (e, s) {
      state = AsyncValue.error(e, s);
    }
  }

  /// Called from SplashScreen to eagerly sync on app start.
  Future<void> loadUser() async {
    await _onAuthStateChanged(FirebaseAuth.instance.currentUser);
  }

  Future<void> signInWithGoogle() async {
    state = const AsyncValue.loading();
    try {
      await _repo.signInWithGoogle();
      // authStateChanges stream will fire and call _onAuthStateChanged.
    } catch (e, s) {
      state = AsyncValue.error(e, s);
    }
  }

  Future<String> sendOtp(String phone) => _repo.sendOtp(phone);

  Future<void> verifyOtp(String verificationId, String otp) async {
    state = const AsyncValue.loading();
    try {
      await _repo.verifyOtp(verificationId, otp);
      // authStateChanges stream will fire and call _onAuthStateChanged.
    } catch (e, s) {
      state = AsyncValue.error(e, s);
    }
  }

  Future<void> signOut() async {
    await _repo.signOut();
    // authStateChanges will emit null → state reset handled in _onAuthStateChanged.
  }

  void updateUser(UserModel user) => state = AsyncValue.data(user);

  @override
  void dispose() {
    _authSub.cancel();
    super.dispose();
  }
}

final authProvider =
    StateNotifierProvider<AuthNotifier, AsyncValue<UserModel?>>((ref) {
  return AuthNotifier(ref.read(authRepositoryProvider));
});

final currentUserProvider = Provider<UserModel?>((ref) {
  return ref.watch(authProvider).valueOrNull;
});
