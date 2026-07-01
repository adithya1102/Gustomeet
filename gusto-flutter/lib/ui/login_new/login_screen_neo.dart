import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/extensions/theme_extensions.dart';
import '../../core/widgets/neo_box.dart';
import '../../core/theme/neo.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';

/// Isolated test screen for the Neobrutalist design system.
/// Auth logic is untouched — this screen calls the existing [authProvider].
class LoginScreenNeo extends ConsumerWidget {
  const LoginScreenNeo({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final isLoading = authState.isLoading;

    // React to auth state changes without coupling to a StatefulWidget.
    ref.listen(authProvider, (_, next) {
      // Show error in a snack bar — mirrors the existing AuthScreen behaviour.
      if (next.hasError) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.error.toString()),
            backgroundColor: kError,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
      // Auto-navigate to home as soon as the user model is available.
      next.whenData((user) {
        if (user != null) context.go('/home');
      });
    });

    return Scaffold(
      backgroundColor: context.kBg,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Design-system watermark tag (non-interactive, uses Neo tokens directly).
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: kGreen.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(Neo.rSm),
                    border: Border.all(color: kGreen, width: Neo.bw),
                  ),
                  child: Text(
                    'Neo Design System — Test',
                    style: context.tsLabelSm.copyWith(color: kGreen),
                  ),
                ),

                const SizedBox(height: 40),

                Text('gusto meets', style: context.tsHeadline),

                const SizedBox(height: 56),

                // ── Primary CTA — NeoBox with press animation ─────────────────
                NeoBox(
                  // Disable press animation while loading.
                  onTap: isLoading
                      ? null
                      : () => ref.read(authProvider.notifier).signInWithGoogle(),
                  color: kGreen,
                  radius: Neo.rPill,
                  shadowOffset: Neo.shadow,
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                  child: isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            color: kOnPrimary,
                          ),
                        )
                      : Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.g_mobiledata,
                              size: 24,
                              color: kOnPrimary,
                            ),
                            const SizedBox(width: 8),
                            Text('Sign in with Google', style: context.tsButton),
                          ],
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
