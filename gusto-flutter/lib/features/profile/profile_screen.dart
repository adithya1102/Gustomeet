import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show FileOptions;
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/constants/app_text_styles.dart';
import '../../core/utils/extensions.dart';
import '../../data/repositories/user_repository.dart';
import '../../data/supabase_client.dart';
import '../../providers/auth_provider.dart';
import '../../shared/widgets/app_bar_widget.dart';
import '../../shared/widgets/primary_button.dart';
import 'host_dashboard_screen.dart';
import '../chat/inbox_screen.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: const AppBarWidget(title: 'Profile', showBack: false),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const SizedBox(height: 8),
          _Avatar(
            name: user?.fullName,
            photoUrl: user?.profilePhotoUrl,
            onTap: () => _updateProfilePhoto(context, ref),
          ),
          const SizedBox(height: 12),
          Center(
            child: Text(
              user?.fullName ?? 'Guest',
              style: context.tsHeadline,
            ),
          ),
          if (user?.googleEmail != null || user?.phoneNumber != null) ...[
            const SizedBox(height: 4),
            Center(
              child: Text(
                user?.googleEmail ?? user?.phoneNumber ?? '',
                style: context.tsBody,
              ),
            ),
          ],
          const SizedBox(height: 16),
          Center(
            child: OutlinedButton(
              onPressed: () => _showEditSheet(context, ref),
              style: OutlinedButton.styleFrom(
                foregroundColor: kGreen,
                side: const BorderSide(color: kGreen),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(
                    horizontal: 28, vertical: 10),
              ),
              child: const Text('Edit Profile'),
            ),
          ),
          const SizedBox(height: 24),

          // Wallet Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: kGreen.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: kGreen.withValues(alpha: 0.25)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.account_balance_wallet_outlined, color: kGreen, size: 20),
                        const SizedBox(width: 8),
                        Text('Gusto Wallet', style: context.tsTitle.copyWith(color: kGreen)),
                      ],
                    ),
                    Text(
                      (user?.walletBalance ?? 0.0).toInt().inr,
                      style: context.tsHeadline.copyWith(color: kGreen, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Use wallet balance for instant, seamless bookings.',
                        style: context.tsCaption.copyWith(color: context.kTextSecondary),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton.icon(
                      onPressed: () => _showTopUpDialog(context, ref),
                      icon: const Icon(Icons.add_rounded, size: 16),
                      label: const Text('Top Up'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kGreen,
                        foregroundColor: kOnPrimary,
                        elevation: 0,
                        minimumSize: const Size(80, 36),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // KYC banner
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: kWarning.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: kWarning.withValues(alpha: 0.25)),
            ),
            child: Row(
              children: [
                const Icon(Icons.verified_outlined, color: kWarning, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(AppStrings.kycBanner,
                      style: context.tsBody.copyWith(
                          color: context.kTextPrimary)),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          if (user?.hasHostProfile == true) ...[
            _Tile(
              icon: Icons.house_outlined,
              label: 'My Listings',
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const HostDashboardScreen()),
              ),
            ),
            const SizedBox(height: 10),
          ],
          _Tile(
            icon: Icons.chat_bubble_outline_rounded,
            label: 'My Messages',
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const InboxScreen()),
            ),
          ),
          const SizedBox(height: 10),
          _Tile(
            icon: Icons.help_outline,
            label: 'Help & Support',
            onTap: () {},
          ),
          const SizedBox(height: 10),
          _Tile(
            icon: Icons.description_outlined,
            label: 'Terms & Privacy',
            onTap: () {},
          ),
          const SizedBox(height: 32),
          PrimaryButton(
            label: 'Sign Out',
            color: kError,
            onPressed: () async {
              await ref.read(authProvider.notifier).signOut();
              if (context.mounted) context.go('/auth');
            },
          ),
        ],
      ),
    );
  }

  void _showTopUpDialog(BuildContext context, WidgetRef ref) {
    final user = ref.read(currentUserProvider);
    if (user == null) return;

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          backgroundColor: ctx.kSurface,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(
            children: [
              const Icon(Icons.account_balance_wallet_rounded, color: kGreen),
              const SizedBox(width: 8),
              Text('Top Up Wallet', style: ctx.tsTitle),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Add funds to your Gusto Wallet instantly to complete bookings.',
                style: ctx.tsBody,
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                alignment: WrapAlignment.center,
                children: [1000, 2000, 5000].map((amount) {
                  return ElevatedButton(
                    onPressed: () async {
                      Navigator.of(ctx).pop();
                      
                      // Show loading indicator
                      if (!context.mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Processing deposit...')),
                      );

                      try {
                        final newBalance = user.walletBalance + amount;
                        final updated = await UserRepository().updateWalletBalance(user.id, newBalance);
                        ref.read(authProvider.notifier).updateUser(updated);

                        if (context.mounted) {
                          ScaffoldMessenger.of(context).clearSnackBars();
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Successfully deposited ${amount.inr}!'),
                              backgroundColor: kGreen,
                            ),
                          );
                        }
                      } catch (e) {
                        // Fallback: update Riverpod state directly
                        final updated = user.copyWith(walletBalance: user.walletBalance + amount);
                        ref.read(authProvider.notifier).updateUser(updated);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).clearSnackBars();
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Deposited ${amount.inr} locally (DB Error: $e)'),
                              backgroundColor: Colors.orange,
                            ),
                          );
                        }
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: kGreen.withValues(alpha: 0.1),
                      foregroundColor: kGreen,
                      elevation: 0,
                      minimumSize: const Size(80, 40),
                      side: const BorderSide(color: kGreen),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    ),
                    child: Text('+${amount.inr}'),
                  );
                }).toList(),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _updateProfilePhoto(BuildContext context, WidgetRef ref) async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;

    final picker = ImagePicker();
    final XFile? image = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
      maxWidth: 512,
      maxHeight: 512,
    );
    if (image == null) return;

    // Show loading indicator
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
            ),
            SizedBox(width: 12),
            Text("Uploading profile photo..."),
          ],
        ),
        duration: Duration(minutes: 1), // long duration, cleared manually
      ),
    );

    try {
      final bytes = await image.readAsBytes();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final filename = 'avatars/profile_${user.id}_$timestamp.jpg';

      // Upload image to public bucket
      await supabase.storage.from('listing-photos').uploadBinary(
            filename,
            bytes,
            fileOptions:
                const FileOptions(contentType: 'image/jpeg', upsert: true),
          );

      final photoUrl =
          supabase.storage.from('listing-photos').getPublicUrl(filename);

      // Save to database profile
      final updated = await UserRepository().updateProfile(
        userId: user.id,
        profilePhotoUrl: photoUrl,
      );

      // Update state
      ref.read(authProvider.notifier).updateUser(updated);

      if (context.mounted) {
        ScaffoldMessenger.of(context).clearSnackBars();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Profile photo updated successfully!'),
            backgroundColor: kGreen,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).clearSnackBars();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to upload photo: $e'),
            backgroundColor: kError,
          ),
        );
      }
    }
  }

  void _showEditSheet(BuildContext context, WidgetRef ref) {
    final user = ref.read(currentUserProvider);
    final nameCtrl = TextEditingController(text: user?.fullName);
    final bioCtrl = TextEditingController(text: user?.bio);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: BoxDecoration(
          color: ctx.kSurface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom,
          left: 20,
          right: 20,
          top: 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                    color: ctx.kBorder,
                    borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 20),
            Text('Edit Profile', style: ctx.tsTitle),
            const SizedBox(height: 16),
            TextField(
              controller: nameCtrl,
              style: TextStyle(color: ctx.kTextPrimary),
              decoration: const InputDecoration(labelText: 'Full name'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: bioCtrl,
              maxLines: 3,
              style: TextStyle(color: ctx.kTextPrimary),
              decoration: const InputDecoration(labelText: 'Bio'),
            ),
            const SizedBox(height: 20),
             PrimaryButton(
              label: 'Save',
              onPressed: () async {
                Navigator.of(ctx).pop();
                final userId = user?.id;
                if (userId == null) return;
                try {
                  final updated = await UserRepository().updateProfile(
                    userId: userId,
                    fullName: nameCtrl.text.trim(),
                    bio: bioCtrl.text.trim(),
                  );
                  ref.read(authProvider.notifier).updateUser(updated);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Profile updated!'), backgroundColor: kGreen),
                  );
                } catch (e) {
                  // Fallback: update Riverpod state directly
                  final updated = user!.copyWith(
                    fullName: nameCtrl.text.trim(),
                    bio: bioCtrl.text.trim(),
                  );
                  ref.read(authProvider.notifier).updateUser(updated);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Profile updated locally (DB Error: $e)'),
                      backgroundColor: Colors.orange,
                    ),
                  );
                }
              },
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  final String? name;
  final String? photoUrl;
  final VoidCallback onTap;

  const _Avatar({this.name, this.photoUrl, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: GestureDetector(
        onTap: onTap,
        child: Stack(
          children: [
            CircleAvatar(
              radius: 48,
              backgroundColor: kGreen.withValues(alpha: 0.15),
              backgroundImage: photoUrl != null
                  ? CachedNetworkImageProvider(photoUrl!)
                  : null,
              child: photoUrl == null
                  ? Text(
                      name?.initials ?? '?',
                      style: const TextStyle(
                          color: kGreen,
                          fontSize: 30,
                          fontWeight: FontWeight.bold),
                    )
                  : null,
            ),
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: kGreen,
                  shape: BoxShape.circle,
                  border: Border.all(color: context.kBg, width: 2),
                ),
                child: const Icon(Icons.camera_alt_rounded, color: kOnPrimary, size: 14),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Tile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _Tile({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: context.kSurface,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: context.kBorder),
        ),
        child: Icon(icon, color: context.kTextPrimary, size: 18),
      ),
      title: Text(label, style: context.tsBodyPrimary),
      trailing: Icon(Icons.chevron_right,
          color: context.kTextSecondary, size: 20),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: context.kBorder),
      ),
      tileColor: context.kSurface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
    );
  }
}
