class UserModel {
  final String id;
  final String? phoneNumber;
  final String? fullName;
  final String role;
  final bool hasHostProfile;
  final String? profilePhotoUrl;
  final bool kycVerified;
  final String? firebaseUid;
  final String? googleEmail;
  final double walletBalance;
  final String? bio;
  final String? creatorType;

  const UserModel({
    required this.id,
    this.phoneNumber,
    this.fullName,
    this.role = 'GUEST',
    this.hasHostProfile = false,
    this.profilePhotoUrl,
    this.kycVerified = false,
    this.firebaseUid,
    this.googleEmail,
    this.walletBalance = 0.0,
    this.bio,
    this.creatorType,
  });

  factory UserModel.fromMap(Map<String, dynamic> m) => UserModel(
        id: m['id'] as String,
        phoneNumber: m['phone_number'] as String?,
        fullName: m['full_name'] as String?,
        role: m['role'] as String? ?? 'GUEST',
        hasHostProfile: m['has_host_profile'] as bool? ?? false,
        profilePhotoUrl: m['profile_photo_url'] as String?,
        kycVerified: m['kyc_verified'] as bool? ?? false,
        firebaseUid: m['firebase_uid'] as String?,
        googleEmail: m['google_email'] as String?,
        walletBalance: (m['wallet_balance'] as num?)?.toDouble() ?? 0.0,
        bio: m['bio'] as String?,
        creatorType: m['creator_type'] as String?,
      );

  Map<String, dynamic> toMap() => {
        'id': id,
        'phone_number': phoneNumber,
        'full_name': fullName,
        'role': role,
        'has_host_profile': hasHostProfile,
        'profile_photo_url': profilePhotoUrl,
        'kyc_verified': kycVerified,
        'firebase_uid': firebaseUid,
        'google_email': googleEmail,
        'wallet_balance': walletBalance,
        'bio': bio,
        'creator_type': creatorType,
      };

  UserModel copyWith({
    String? fullName,
    String? bio,
    String? profilePhotoUrl,
    bool? hasHostProfile,
    double? walletBalance,
  }) =>
      UserModel(
        id: id,
        phoneNumber: phoneNumber,
        fullName: fullName ?? this.fullName,
        role: role,
        hasHostProfile: hasHostProfile ?? this.hasHostProfile,
        profilePhotoUrl: profilePhotoUrl ?? this.profilePhotoUrl,
        kycVerified: kycVerified,
        firebaseUid: firebaseUid,
        googleEmail: googleEmail,
        walletBalance: walletBalance ?? this.walletBalance,
        bio: bio ?? this.bio,
        creatorType: creatorType,
      );
}
