import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../providers/auth_provider.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _resolve();
  }

  Future<void> _resolve() async {
    await Future.delayed(const Duration(milliseconds: 500));

    User? firebaseUser;
    try {
      firebaseUser = FirebaseAuth.instance.currentUser;
    } catch (e) {
      debugPrint('Error getting firebase user during splash: $e');
    }

    if (firebaseUser == null) {
      if (mounted) context.go('/auth');
      return;
    }

    try {
      final authNotifier = ref.read(authProvider.notifier);
      final storedId = await ref.read(authRepositoryProvider).getStoredUserId();

      if (storedId != null) {
        await authNotifier.loadUser();
      } else {
        await authNotifier.loadUser();
      }
    } catch (_) {}

    if (mounted) {
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.kBg,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: Image.asset(
                'assets/logo.png',
                width: 80,
                height: 80,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(height: 16),
            Text('gusto meets', style: context.tsHeadline),
            const SizedBox(height: 32),
            const CircularProgressIndicator(
                color: kGreen, strokeWidth: 2),
          ],
        ),
      ),
    );
  }
}
