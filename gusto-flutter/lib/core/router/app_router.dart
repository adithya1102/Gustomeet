import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';
import '../../features/splash/splash_screen.dart';
import '../../features/auth/auth_screen.dart';
import '../../features/auth/otp_screen.dart';
import '../../features/home/home_screen.dart';
import '../../features/listing_detail/listing_detail_screen.dart';
import '../../features/booking/booking_flow_screen.dart';
import '../../features/booking/booking_confirm_screen.dart';
import '../../features/booking/booking_success_screen.dart';
import '../../features/my_bookings/my_bookings_screen.dart';
import '../../features/profile/profile_screen.dart';
import '../../features/host_onboarding/host_onboarding_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/splash',
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/auth',
        builder: (context, state) => const AuthScreen(),
      ),
      GoRoute(
        path: '/auth/otp',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>;
          return OtpScreen(
            phone: extra['phone'] as String,
            verificationId: extra['verificationId'] as String,
          );
        },
      ),
      ShellRoute(
        builder: (context, state, child) =>
            HomeShell(location: state.uri.toString(), child: child),
        routes: [
          GoRoute(
            path: '/home',
            builder: (context, state) => const HomeScreen(),
          ),
          GoRoute(
            path: '/bookings',
            builder: (context, state) => const MyBookingsScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/listing/:id',
        builder: (context, state) => ListingDetailScreen(
          terraceId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: '/booking/flow',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>;
          return BookingFlowScreen(params: extra);
        },
      ),
      GoRoute(
        path: '/booking/confirm',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>;
          return BookingConfirmScreen(params: extra);
        },
      ),
      GoRoute(
        path: '/booking/success',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>;
          return BookingSuccessScreen(params: extra);
        },
      ),
      GoRoute(
        path: '/host/onboarding',
        builder: (context, state) => const HostOnboardingScreen(),
      ),
    ],
  );
});

class HomeShell extends StatelessWidget {
  final Widget child;
  final String location;

  const HomeShell({super.key, required this.child, required this.location});

  int get _selectedIndex {
    if (location.startsWith('/bookings')) return 1;
    if (location.startsWith('/profile')) return 2;
    return 0;
  }

  Widget _buildNavItem(int index, IconData icon, String label, BuildContext context) {
    final isSelected = _selectedIndex == index;

    if (isSelected) {
      return GestureDetector(
        onTap: () {},
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.black, width: 2),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: Colors.black, size: 20),
              const SizedBox(width: 6),
              Text(
                label,
                style: GoogleFonts.lexend(
                  color: Colors.black,
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
        ),
      );
    } else {
      return GestureDetector(
        onTap: () {
          if (index == 0) context.go('/home');
          if (index == 1) context.go('/bookings');
          if (index == 2) context.go('/profile');
        },
        child: Container(
          padding: const EdgeInsets.all(12),
          child: Icon(icon, color: Colors.white.withOpacity(0.8), size: 24),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final borderColor = isDark ? Colors.white : Colors.black;
    final shadowColor = isDark ? kGreen.withValues(alpha: 0.8) : Colors.black;

    return Scaffold(
      body: child,
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 0, 24, 16),
          child: Container(
            height: 70,
            decoration: BoxDecoration(
              color: const Color(0xFF2C2C2C),
              borderRadius: BorderRadius.circular(35),
              border: Border.all(color: borderColor, width: 3),
              boxShadow: [
                BoxShadow(
                  color: shadowColor,
                  offset: const Offset(4, 4),
                  blurRadius: 0,
                  spreadRadius: 0,
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildNavItem(0, Icons.home_rounded, 'Home', context),
                _buildNavItem(1, Icons.calendar_today_rounded, 'Bookings', context),
                _buildNavItem(2, Icons.person_rounded, 'Profile', context),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
