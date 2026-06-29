import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:supabase_flutter/supabase_flutter.dart' show OAuthProvider;
import 'package:firebase_auth/firebase_auth.dart' hide OAuthProvider;
import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../supabase_client.dart';

const String _prefUserId = 'supabase_user_id';

class AuthRepository {
  FirebaseAuth? get _auth {
    try {
      return FirebaseAuth.instance;
    } catch (_) {
      return null;
    }
  }
  final _googleSignIn = GoogleSignIn();

  FirebaseAuth? get firebaseAuth => _auth;

  Future<UserCredential> signInWithGoogle() async {
    final auth = _auth;
    if (auth == null) {
      throw Exception('Firebase Authentication is not initialized.');
    }
    if (kIsWeb) {
      final provider = GoogleAuthProvider();
      return auth.signInWithPopup(provider);
    } else {
      final googleUser = await _googleSignIn.signIn();
      if (googleUser == null) throw Exception('Google sign-in cancelled');
      final googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      return auth.signInWithCredential(credential);
    }
  }

  Future<String> sendOtp(String phone) async {
    final auth = _auth;
    if (auth == null) {
      throw Exception('Firebase Authentication is not initialized.');
    }
    String verificationId = '';
    final completer = <String>[];
    await auth.verifyPhoneNumber(
      phoneNumber: '+91$phone',
      verificationCompleted: (_) {},
      verificationFailed: (e) => throw e,
      codeSent: (vid, _) => completer.add(vid),
      codeAutoRetrievalTimeout: (_) {},
      timeout: const Duration(seconds: 60),
    );
    if (completer.isNotEmpty) verificationId = completer.first;
    return verificationId;
  }

  Future<UserCredential> verifyOtp(String verificationId, String otp) async {
    final auth = _auth;
    if (auth == null) {
      throw Exception('Firebase Authentication is not initialized.');
    }
    final credential = PhoneAuthProvider.credential(
      verificationId: verificationId,
      smsCode: otp,
    );
    return auth.signInWithCredential(credential);
  }

  Future<UserModel> upsertSupabaseUser(User firebaseUser) async {
    // Sync Firebase Auth with Supabase using Third-Party Auth
    try {
      final idToken = await firebaseUser.getIdToken();
      if (idToken != null) {
        await supabase.auth.signInWithIdToken(
          provider: OAuthProvider.google,
          idToken: idToken,
        );
        print('✅ Supabase Auth synced successfully using Firebase ID Token.');
      }
    } catch (e) {
      print('⚠️ Supabase Auth Sync Error (ignoring in dev/local environments): $e');
    }

    final existing = await supabase
        .from('users')
        .select()
        .eq('firebase_uid', firebaseUser.uid)
        .maybeSingle();

    if (existing != null) {
      final user = UserModel.fromMap(existing);
      await _storeUserId(user.id);
      return user;
    }

    final inserted = await supabase
        .from('users')
        .insert({
          'firebase_uid': firebaseUser.uid,
          'full_name': firebaseUser.displayName,
          'google_email': firebaseUser.email,
          'role': 'GUEST',
          'kyc_verified': true,
        })
        .select()
        .single();

    final user = UserModel.fromMap(inserted);
    await _storeUserId(user.id);
    return user;
  }

  Future<void> _storeUserId(String id) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefUserId, id);
  }

  Future<String?> getStoredUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_prefUserId);
  }

  Future<void> signOut() async {
    await _auth?.signOut();
    await _googleSignIn.signOut();
    try {
      await supabase.auth.signOut();
    } catch (_) {}
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_prefUserId);
  }
}
