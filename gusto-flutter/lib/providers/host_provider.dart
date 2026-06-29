import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../data/supabase_client.dart';
import '../data/repositories/terrace_repository.dart';
import '../data/repositories/user_repository.dart';

class HostOnboardingState {
  final String city;
  final String area;
  final String addressLine;
  final int floorLevel;
  final String terraceDirection;
  final String sizeCategory;
  final int maxCapacity;
  final Map<String, bool> amenities;
  final bool allowAlcohol;
  final bool allowSmoking;
  final bool allowLoudMusic;
  final bool allowOutsideFood;
  final bool allowCouples;
  final List<String> allowedPurposes;
  final List<bool> safetyChecklist;
  final List<String> uploadedPhotoUrls;
  final bool isUploading;
  final int hourlyRate;
  final String accountNumber;
  final String ifsc;
  final bool isSubmitting;
  final String? error;

  const HostOnboardingState({
    this.city = 'Chennai',
    this.area = '',
    this.addressLine = '',
    this.floorLevel = 1,
    this.terraceDirection = 'NORTH',
    this.sizeCategory = '300-500',
    this.maxCapacity = 10,
    this.amenities = const {},
    this.allowAlcohol = false,
    this.allowSmoking = false,
    this.allowLoudMusic = false,
    this.allowOutsideFood = false,
    this.allowCouples = false,
    this.allowedPurposes = const [],
    this.safetyChecklist = const [false, false, false, false, false, false],
    this.uploadedPhotoUrls = const [],
    this.isUploading = false,
    this.hourlyRate = 300,
    this.accountNumber = '',
    this.ifsc = '',
    this.isSubmitting = false,
    this.error,
  });

  HostOnboardingState copyWith({
    String? city,
    String? area,
    String? addressLine,
    int? floorLevel,
    String? terraceDirection,
    String? sizeCategory,
    int? maxCapacity,
    Map<String, bool>? amenities,
    bool? allowAlcohol,
    bool? allowSmoking,
    bool? allowLoudMusic,
    bool? allowOutsideFood,
    bool? allowCouples,
    List<String>? allowedPurposes,
    List<bool>? safetyChecklist,
    List<String>? uploadedPhotoUrls,
    bool? isUploading,
    int? hourlyRate,
    String? accountNumber,
    String? ifsc,
    bool? isSubmitting,
    String? error,
  }) =>
      HostOnboardingState(
        city: city ?? this.city,
        area: area ?? this.area,
        addressLine: addressLine ?? this.addressLine,
        floorLevel: floorLevel ?? this.floorLevel,
        terraceDirection: terraceDirection ?? this.terraceDirection,
        sizeCategory: sizeCategory ?? this.sizeCategory,
        maxCapacity: maxCapacity ?? this.maxCapacity,
        amenities: amenities ?? this.amenities,
        allowAlcohol: allowAlcohol ?? this.allowAlcohol,
        allowSmoking: allowSmoking ?? this.allowSmoking,
        allowLoudMusic: allowLoudMusic ?? this.allowLoudMusic,
        allowOutsideFood: allowOutsideFood ?? this.allowOutsideFood,
        allowCouples: allowCouples ?? this.allowCouples,
        allowedPurposes: allowedPurposes ?? this.allowedPurposes,
        safetyChecklist: safetyChecklist ?? this.safetyChecklist,
        uploadedPhotoUrls: uploadedPhotoUrls ?? this.uploadedPhotoUrls,
        isUploading: isUploading ?? this.isUploading,
        hourlyRate: hourlyRate ?? this.hourlyRate,
        accountNumber: accountNumber ?? this.accountNumber,
        ifsc: ifsc ?? this.ifsc,
        isSubmitting: isSubmitting ?? this.isSubmitting,
        error: error,
      );

  bool get safetyAllChecked => safetyChecklist.every((c) => c);
}

class HostOnboardingNotifier extends StateNotifier<HostOnboardingState> {
  final TerraceRepository _terraceRepo;
  final UserRepository _userRepo;

  HostOnboardingNotifier(this._terraceRepo, this._userRepo)
      : super(const HostOnboardingState());

  void update(HostOnboardingState Function(HostOnboardingState) fn) {
    state = fn(state);
  }

  void toggleAmenity(String key, bool value) {
    final updated = Map<String, bool>.from(state.amenities);
    updated[key] = value;
    state = state.copyWith(amenities: updated);
  }

  void togglePurpose(String purpose) {
    final list = List<String>.from(state.allowedPurposes);
    if (list.contains(purpose)) {
      list.remove(purpose);
    } else {
      list.add(purpose);
    }
    state = state.copyWith(allowedPurposes: list);
  }

  void setSafetyItem(int index, bool value) {
    final list = List<bool>.from(state.safetyChecklist);
    list[index] = value;
    state = state.copyWith(safetyChecklist: list);
  }

  // Opens the device gallery or files.
  Future<void> capturePhoto(String userId) async {
    if (state.uploadedPhotoUrls.length >= 8) return;

    final picker = ImagePicker();
    final XFile? photo = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
      maxWidth: 1920,
      maxHeight: 1920,
    );
    if (photo == null) return; // user dismissed picker

    state = state.copyWith(isUploading: true, error: null);
    try {
      final bytes = await photo.readAsBytes();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final filename = 'terraces/temp_$userId/$timestamp.jpg';

      await supabase.storage.from('listing-photos').uploadBinary(
            filename,
            bytes,
            fileOptions:
                const FileOptions(contentType: 'image/jpeg', upsert: true),
          );

      final url =
          supabase.storage.from('listing-photos').getPublicUrl(filename);

      state = state.copyWith(
        isUploading: false,
        uploadedPhotoUrls: [...state.uploadedPhotoUrls, url],
      );
    } catch (e) {
      state = state.copyWith(isUploading: false, error: e.toString());
      rethrow;
    }
  }

  void removePhoto(String url) {
    state = state.copyWith(
      uploadedPhotoUrls:
          state.uploadedPhotoUrls.where((u) => u != url).toList(),
    );
  }

  Future<void> submit(String userId) async {
    state = state.copyWith(isSubmitting: true);
    try {
      final terraceId = await _terraceRepo.createTerrace(
        hostId: userId,
        area: state.area,
        addressLine: state.addressLine,
        maxCapacity: state.maxCapacity,
        floorLevel: state.floorLevel,
        terraceDirection: state.terraceDirection,
        photos: state.uploadedPhotoUrls,
        rate: state.hourlyRate,
        permissions: {
          'allow_alcohol': state.allowAlcohol,
          'allow_smoking': state.allowSmoking,
          'allow_loud_music': state.allowLoudMusic,
          'allow_outside_food': state.allowOutsideFood,
          'allow_couples': state.allowCouples,
          'allowed_purposes': state.allowedPurposes,
        },
      );

      await _userRepo.setHasHostProfile(userId);
      debugPrint('Terrace submitted: $terraceId');
      state = state.copyWith(isSubmitting: false);
    } catch (e) {
      state = state.copyWith(isSubmitting: false, error: e.toString());
      rethrow;
    }
  }
}

final hostOnboardingProvider =
    StateNotifierProvider<HostOnboardingNotifier, HostOnboardingState>((ref) {
  return HostOnboardingNotifier(
    TerraceRepository(),
    UserRepository(),
  );
});
