class BookingModel {
  final String id;
  final String guestId;
  final String terraceId;
  final String durationType;
  final DateTime startTime;
  final DateTime endTime;
  final String? purpose;
  final int guestCount;
  final String status;
  final int ratePerUnit;
  final double? totalTimeCost;
  final int securityDeposit;
  final double? platformFee;
  final double? totalCharged;
  final int cleaningFee;
  final int utilityFee;
  final bool guestCheckedIn;
  final bool digitalWaiverSigned;
  final String? terraceName;
  final String? terraceCoverPhoto;

  const BookingModel({
    required this.id,
    required this.guestId,
    required this.terraceId,
    required this.durationType,
    required this.startTime,
    required this.endTime,
    this.purpose,
    this.guestCount = 1,
    required this.status,
    required this.ratePerUnit,
    this.totalTimeCost,
    this.securityDeposit = 500,
    this.platformFee,
    this.totalCharged,
    this.cleaningFee = 150,
    this.utilityFee = 50,
    this.guestCheckedIn = false,
    this.digitalWaiverSigned = false,
    this.terraceName,
    this.terraceCoverPhoto,
  });

  factory BookingModel.fromMap(Map<String, dynamic> m) {
    final terraceData = m['terraces'] as Map<String, dynamic>?;
    return BookingModel(
      id: m['id'] as String,
      guestId: m['guest_id'] as String,
      terraceId: m['terrace_id'] as String,
      durationType: m['duration_type'] as String? ?? 'HOURLY',
      startTime: DateTime.parse(m['start_time'] as String),
      endTime: DateTime.parse(m['end_time'] as String),
      purpose: m['purpose'] as String?,
      guestCount: (m['guest_count'] as num?)?.toInt() ?? 1,
      status: m['status'] as String,
      ratePerUnit: (m['rate_per_unit'] as num?)?.toInt() ?? 0,
      totalTimeCost: (m['total_time_cost'] as num?)?.toDouble(),
      securityDeposit: (m['security_deposit'] as num?)?.toInt() ?? 500,
      platformFee: (m['platform_fee'] as num?)?.toDouble(),
      totalCharged: (m['total_charged'] as num?)?.toDouble(),
      cleaningFee: (m['cleaning_fee'] as num?)?.toInt() ?? 150,
      utilityFee: (m['utility_fee'] as num?)?.toInt() ?? 50,
      guestCheckedIn: m['guest_checked_in'] as bool? ?? false,
      digitalWaiverSigned: m['digital_waiver_signed'] as bool? ?? false,
      terraceName: terraceData?['title'] as String?,
      terraceCoverPhoto: terraceData != null
          ? ((terraceData['platform_photo_urls'] as List?)?.firstOrNull as String? ??
              (terraceData['photos'] as List?)?.firstOrNull as String?)
          : null,
    );
  }

  bool get isUpcoming =>
      status == 'CONFIRMED' || status == 'ACTIVE' || status == 'PENDING_PAYMENT';
  bool get isPast => status == 'COMPLETED' || status == 'CANCELLED' || status == 'DISPUTED';

  String get shortId => id.substring(0, 8).toUpperCase();
}
