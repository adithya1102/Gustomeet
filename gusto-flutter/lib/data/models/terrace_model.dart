class TerraceModel {
  final String id;
  final String hostId;
  final String title;
  final String? description;
  final String area;
  final String city;
  final String? addressLine;
  final double? geoLat;
  final double? geoLng;
  final String accessCategory;
  final int maxCapacity;
  final List<String> photos;
  final List<String> platformPhotoUrls;
  final String verification;
  final bool isActive;
  final bool creatorReady;
  final int? floorLevel;
  final String? terraceDirection;
  final String? noiseEnvironment;
  final bool? parkingAvailable;
  final int cleaningBufferMinutes;
  final TerraceRateModel? hourlyRate;
  final TerracePermissionsModel? permissions;
  final TerraceLightDataModel? lightData;
  final double? avgRating;
  final int reviewCount;

  const TerraceModel({
    required this.id,
    required this.hostId,
    required this.title,
    this.description,
    required this.area,
    required this.city,
    this.addressLine,
    this.geoLat,
    this.geoLng,
    this.accessCategory = 'INDIVIDUAL_HOUSE',
    this.maxCapacity = 10,
    this.photos = const [],
    this.platformPhotoUrls = const [],
    this.verification = 'UNVERIFIED',
    this.isActive = false,
    this.creatorReady = false,
    this.floorLevel,
    this.terraceDirection,
    this.noiseEnvironment,
    this.parkingAvailable,
    this.cleaningBufferMinutes = 45,
    this.hourlyRate,
    this.permissions,
    this.lightData,
    this.avgRating,
    this.reviewCount = 0,
  });

  List<String> get allPhotos {
    final combined = [...platformPhotoUrls, ...photos];
    return combined.isEmpty ? [] : combined;
  }

  String? get coverPhoto => allPhotos.isNotEmpty ? allPhotos.first : null;

  // Supabase can return a join as either a List or a single Map depending
  // on its relationship inference. This normalises both cases into a List.
  static List<Map<String, dynamic>>? _toList(dynamic val) {
    if (val == null) return null;
    if (val is List) return val.cast<Map<String, dynamic>>();
    if (val is Map) return [val as Map<String, dynamic>];
    return null;
  }

  factory TerraceModel.fromMap(Map<String, dynamic> m) => TerraceModel(
        id: m['id'] as String,
        hostId: m['host_id'] as String,
        title: m['title'] as String,
        description: m['description'] as String?,
        area: m['area'] as String? ?? '',
        city: m['city'] as String? ?? '',
        addressLine: m['address_line'] as String?,
        geoLat: (m['geo_lat'] as num?)?.toDouble(),
        geoLng: (m['geo_lng'] as num?)?.toDouble(),
        accessCategory: m['access_category'] as String? ?? 'INDIVIDUAL_HOUSE',
        maxCapacity: (m['max_capacity'] as num?)?.toInt() ?? 10,
        photos: List<String>.from(m['photos'] as List? ?? []),
        platformPhotoUrls: List<String>.from(m['platform_photo_urls'] as List? ?? []),
        verification: m['verification'] as String? ?? 'UNVERIFIED',
        isActive: m['is_active'] as bool? ?? false,
        creatorReady: m['creator_ready'] as bool? ?? false,
        floorLevel: (m['floor_level'] as num?)?.toInt(),
        terraceDirection: m['terrace_direction'] as String?,
        noiseEnvironment: m['noise_environment'] as String?,
        parkingAvailable: m['parking_available'] as bool?,
        cleaningBufferMinutes: (m['cleaning_buffer_minutes'] as num?)?.toInt() ?? 45,
        hourlyRate: _toList(m['terrace_rates'])?.isNotEmpty == true
            ? TerraceRateModel.fromMap(_toList(m['terrace_rates'])!.first)
            : null,
        permissions: _toList(m['terrace_permissions'])?.isNotEmpty == true
            ? TerracePermissionsModel.fromMap(_toList(m['terrace_permissions'])!.first)
            : null,
        lightData: _toList(m['terrace_light_data'])?.isNotEmpty == true
            ? TerraceLightDataModel.fromMap(_toList(m['terrace_light_data'])!.first)
            : null,
      );
}

class TerraceRateModel {
  final String id;
  final String terraceId;
  final String durationType;
  final int rate;

  const TerraceRateModel({
    required this.id,
    required this.terraceId,
    required this.durationType,
    required this.rate,
  });

  factory TerraceRateModel.fromMap(Map<String, dynamic> m) => TerraceRateModel(
        id: m['id'] as String,
        terraceId: m['terrace_id'] as String,
        durationType: m['duration_type'] as String? ?? 'HOURLY',
        rate: (m['rate'] as num).toInt(),
      );
}

class TerracePermissionsModel {
  final String terraceId;
  final bool allowAlcohol;
  final bool allowSmoking;
  final bool allowLoudMusic;
  final bool allowOutsideFood;
  final bool allowCouples;
  final List<String> allowedPurposes;

  const TerracePermissionsModel({
    required this.terraceId,
    this.allowAlcohol = false,
    this.allowSmoking = false,
    this.allowLoudMusic = false,
    this.allowOutsideFood = false,
    this.allowCouples = false,
    this.allowedPurposes = const [],
  });

  factory TerracePermissionsModel.fromMap(Map<String, dynamic> m) => TerracePermissionsModel(
        terraceId: m['terrace_id'] as String,
        allowAlcohol: m['allow_alcohol'] as bool? ?? false,
        allowSmoking: m['allow_smoking'] as bool? ?? false,
        allowLoudMusic: m['allow_loud_music'] as bool? ?? false,
        allowOutsideFood: m['allow_outside_food'] as bool? ?? false,
        allowCouples: m['allow_couples'] as bool? ?? false,
        allowedPurposes: List<String>.from(m['allowed_purposes'] as List? ?? []),
      );
}

class TerraceLightDataModel {
  final String terraceId;
  final String? goldenHourStart;
  final String? goldenHourEnd;
  final String? bestShootPeriod;

  const TerraceLightDataModel({
    required this.terraceId,
    this.goldenHourStart,
    this.goldenHourEnd,
    this.bestShootPeriod,
  });

  factory TerraceLightDataModel.fromMap(Map<String, dynamic> m) => TerraceLightDataModel(
        terraceId: m['terrace_id'] as String,
        goldenHourStart: m['golden_hour_start'] as String?,
        goldenHourEnd: m['golden_hour_end'] as String?,
        bestShootPeriod: m['best_shoot_period'] as String?,
      );
}
