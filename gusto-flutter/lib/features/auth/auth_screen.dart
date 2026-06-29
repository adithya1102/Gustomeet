import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_core/firebase_core.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/constants/app_text_styles.dart';
import '../../core/utils/validators.dart';
import '../../providers/auth_provider.dart';
import '../../shared/widgets/primary_button.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  final _phoneCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isGoogleLoading = false;
  bool _isOtpLoading = false;
  bool _firebaseAvailable = true;

  @override
  void initState() {
    super.initState();
    try {
      _firebaseAvailable = Firebase.apps.isNotEmpty;
    } catch (_) {
      _firebaseAvailable = false;
    }
  }

  @override
  void dispose() {
    _phoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _signInGoogle() async {
    if (!_firebaseAvailable) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text(AppStrings.authUnavailable)),
      );
      return;
    }
    setState(() => _isGoogleLoading = true);
    try {
      await ref.read(authProvider.notifier).signInWithGoogle();
      if (mounted) context.go('/home');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: kError),
        );
      }
    } finally {
      if (mounted) setState(() => _isGoogleLoading = false);
    }
  }

  Future<void> _sendOtp() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_firebaseAvailable) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text(AppStrings.authUnavailable)),
      );
      return;
    }
    setState(() => _isOtpLoading = true);
    try {
      final vid = await ref
          .read(authProvider.notifier)
          .sendOtp(_phoneCtrl.text.trim());
      if (mounted) {
        context.push('/auth/otp', extra: {
          'phone': _phoneCtrl.text.trim(),
          'verificationId': vid,
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: kError),
        );
      }
    } finally {
      if (mounted) setState(() => _isOtpLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [kGreen, kPurple],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
          ),
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              height: MediaQuery.of(context).size.height * 0.62,
              width: double.infinity,
              decoration: BoxDecoration(
                color: context.kSurface,
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 28, 24, 32),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(AppStrings.tagline, style: context.tsHeadline),
                      const SizedBox(height: 6),
                      Text(AppStrings.subtitle, style: context.tsBody),
                      const SizedBox(height: 28),
                      PrimaryButton(
                        label: AppStrings.continueWithGoogle,
                        onPressed: _signInGoogle,
                        isLoading: _isGoogleLoading,
                        color: context.kSurfaceHigh,
                        icon: Icon(Icons.g_mobiledata,
                            color: context.kTextPrimary, size: 22),
                      ),
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          Expanded(
                              child: Divider(color: context.kBorder)),
                          Padding(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 12),
                            child: Text('or', style: context.tsCaption),
                          ),
                          Expanded(
                              child: Divider(color: context.kBorder)),
                        ],
                      ),
                      const SizedBox(height: 20),
                      TextFormField(
                        controller: _phoneCtrl,
                        keyboardType: TextInputType.phone,
                        maxLength: 10,
                        validator: Validators.phone,
                        decoration: const InputDecoration(
                          prefixText: '+91  ',
                          hintText: AppStrings.phoneHint,
                          counterText: '',
                        ),
                      ),
                      const SizedBox(height: 16),
                      PrimaryButton(
                        label: AppStrings.getOtp,
                        onPressed: _sendOtp,
                        isLoading: _isOtpLoading,
                      ),
                      const SizedBox(height: 20),
                      Center(
                        child: Text(
                          AppStrings.termsText,
                          style: context.tsCaption,
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          Positioned(
            top: 64,
            left: 0,
            right: 0,
            child: Column(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: Image.asset(
                    'assets/logo.png',
                    width: 60,
                    height: 60,
                    fit: BoxFit.cover,
                  ),
                ),
                const SizedBox(height: 8),
                const Text('gusto meets',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
