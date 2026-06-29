import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/constants/app_text_styles.dart';
import '../../providers/auth_provider.dart';
import '../../providers/host_provider.dart';
import 'steps/step1_intro.dart';
import 'steps/step2_property_details.dart';
import 'steps/step3_amenities.dart';
import 'steps/step4_permissions.dart';
import 'steps/step5_safety_checklist.dart';
import 'steps/step6_photos.dart';
import 'steps/step7_pricing.dart';

class HostOnboardingScreen extends ConsumerStatefulWidget {
  const HostOnboardingScreen({super.key});

  @override
  ConsumerState<HostOnboardingScreen> createState() =>
      _HostOnboardingScreenState();
}

class _HostOnboardingScreenState extends ConsumerState<HostOnboardingScreen> {
  int _step = 0;
  final _pageCtrl = PageController();

  void _next() {
    if (_step < 6) {
      setState(() => _step++);
      _pageCtrl.animateToPage(_step,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut);
    }
  }

  void _prev() {
    if (_step > 0) {
      setState(() => _step--);
      _pageCtrl.animateToPage(_step,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut);
    } else {
      context.pop();
    }
  }

  Future<void> _submit() async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;
    try {
      await ref.read(hostOnboardingProvider.notifier).submit(user.id);
      
      // Update Riverpod user state immediately so the Host Dashboard unlocks
      final updatedUser = user.copyWith(hasHostProfile: true);
      ref.read(authProvider.notifier).updateUser(updatedUser);

      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (_) => AlertDialog(
            content: Text(AppStrings.listingUnderReview,
                textAlign: TextAlign.center,
                style: context.tsBody.copyWith(fontSize: 15)),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  context.go('/home');
                },
                child: const Text('Go Home',
                    style: TextStyle(color: kGreen)),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Failed: ${e.toString()}'),
              backgroundColor: kError),
        );
      }
    }
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(hostOnboardingProvider);
    final user = ref.watch(currentUserProvider);

    final steps = [
      Step1Intro(onNext: _next),
      Step2PropertyDetails(onNext: _next),
      Step3Amenities(onNext: _next),
      Step4Permissions(onNext: _next),
      Step5SafetyChecklist(onNext: _next),
      Step6Photos(onNext: _next, userId: user?.id ?? ''),
      Step7Pricing(
        onSubmit: _submit,
        isSubmitting: state.isSubmitting,
      ),
    ];

    return Scaffold(
      backgroundColor: context.kBg,
      appBar: AppBar(
        backgroundColor: context.kSurface,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: context.kTextPrimary),
          onPressed: _prev,
        ),
        title: Text(
          'Step ${_step + 1} of 7',
          style: context.tsLabel,
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: LinearProgressIndicator(
            value: (_step + 1) / 7,
            backgroundColor: context.kBorder,
            color: kGreen,
            minHeight: 4,
          ),
        ),
      ),
      body: PageView(
        controller: _pageCtrl,
        physics: const NeverScrollableScrollPhysics(),
        children: steps,
      ),
    );
  }
}
