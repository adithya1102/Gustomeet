import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../providers/host_provider.dart';
import '../../../shared/widgets/primary_button.dart';

class Step6Photos extends ConsumerWidget {
  final VoidCallback onNext;
  final String userId;

  const Step6Photos({super.key, required this.onNext, required this.userId});

  Future<void> _capturePhoto(
      BuildContext context, HostOnboardingNotifier notifier) async {
    try {
      await notifier.capturePhoto(userId);
    } catch (_) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
              'Could not capture photo. Please check camera permissions in Settings.'),
          backgroundColor: kError,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(hostOnboardingProvider);
    final notifier = ref.read(hostOnboardingProvider.notifier);
    final photos = state.uploadedPhotoUrls;
    final canProceed = photos.length >= 3;
    final canCapture = photos.length < 8 && !state.isUploading;
    final needed = 3 - photos.length;

    return Column(
      children: [
        // Camera-only notice banner
        Container(
          width: double.infinity,
          color: kGreen.withValues(alpha: 0.12),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            children: [
              const Icon(Icons.camera_alt, color: kGreen, size: 16),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Live camera only — gallery uploads are not allowed',
                  style: context.tsCaption.copyWith(color: kGreen),
                ),
              ),
            ],
          ),
        ),

        // Header
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Capture Your Terrace', style: context.tsHeadline),
              const SizedBox(height: 4),
              Text(
                'Take 3–8 live photos. Authentic shots get 2× more bookings.',
                style: context.tsBody,
              ),
            ],
          ),
        ),

        // Photo grid or empty state
        Expanded(
          child: photos.isEmpty
              ? _EmptyPhotoState()
              : Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: GridView.builder(
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 10,
                      mainAxisSpacing: 10,
                      childAspectRatio: 1.1,
                    ),
                    itemCount: photos.length,
                    itemBuilder: (_, i) => _PhotoTile(
                      url: photos[i],
                      onDelete: () => notifier.removePhoto(photos[i]),
                    ),
                  ),
                ),
        ),

        // Bottom sticky action area
        Container(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 36),
          decoration: BoxDecoration(
            color: context.kSurface,
            border: Border(top: BorderSide(color: context.kBorder)),
          ),
          child: Column(
            children: [
              // Count + progress bar
              Row(
                children: [
                  Text('${photos.length} / 8', style: context.tsLabel),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: photos.length / 8,
                        backgroundColor: context.kBorder,
                        color: canProceed ? kGreen : kWarning,
                        minHeight: 6,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    canProceed ? 'Ready' : 'min 3',
                    style: context.tsCaption.copyWith(
                      color: canProceed ? kGreen : kWarning,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              // Uploading indicator or camera shutter button
              if (state.isUploading) ...[
                const SizedBox(
                  width: 48,
                  height: 48,
                  child: CircularProgressIndicator(
                      color: kGreen, strokeWidth: 3),
                ),
                const SizedBox(height: 6),
                Text('Uploading photo…', style: context.tsCaption),
                const SizedBox(height: 20),
              ] else if (canCapture) ...[
                GestureDetector(
                  onTap: () => _capturePhoto(context, notifier),
                  child: Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: kGreen,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: kGreen.withValues(alpha: 0.35),
                          blurRadius: 18,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.camera_alt,
                      color: kOnPrimary,
                      size: 32,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Text('Tap to take a photo', style: context.tsCaption),
                const SizedBox(height: 20),
              ] else ...[
                const SizedBox(height: 4),
              ],

              PrimaryButton(
                label: canProceed
                    ? 'Continue'
                    : 'Need $needed more photo${needed > 1 ? 's' : ''}',
                onPressed: canProceed ? onNext : null,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _EmptyPhotoState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.camera_alt_outlined, size: 72, color: context.kBorder),
          const SizedBox(height: 12),
          Text('No photos yet', style: context.tsBody),
          const SizedBox(height: 4),
          Text(
            'Tap the camera button below to start',
            style: context.tsCaption,
          ),
        ],
      ),
    );
  }
}

class _PhotoTile extends StatelessWidget {
  final String url;
  final VoidCallback onDelete;

  const _PhotoTile({required this.url, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: CachedNetworkImage(
            imageUrl: url,
            width: double.infinity,
            height: double.infinity,
            fit: BoxFit.cover,
            placeholder: (_, __) => Container(color: context.kBorder),
            errorWidget: (_, __, ___) => Container(color: context.kBorder),
          ),
        ),
        Positioned(
          top: 6,
          right: 6,
          child: GestureDetector(
            onTap: onDelete,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                color: kError,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close, color: kOnPrimary, size: 14),
            ),
          ),
        ),
      ],
    );
  }
}
