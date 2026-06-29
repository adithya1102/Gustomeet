import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

// ── Color-free base styles (font / size / weight only) ─────────────────────
class AppTextStyles {
  static final TextStyle display = GoogleFonts.plusJakartaSans(
    fontSize: 32, fontWeight: FontWeight.w700, height: 1.2,
  );
  static final TextStyle headline = GoogleFonts.plusJakartaSans(
    fontSize: 24, fontWeight: FontWeight.w600, height: 1.3,
  );
  static final TextStyle title = GoogleFonts.plusJakartaSans(
    fontSize: 18, fontWeight: FontWeight.w600,
  );
  static final TextStyle body = GoogleFonts.inter(
    fontSize: 14, fontWeight: FontWeight.w400, height: 1.5,
  );
  static final TextStyle caption = GoogleFonts.inter(
    fontSize: 12, fontWeight: FontWeight.w400,
  );
  static final TextStyle bodyPrimary = GoogleFonts.inter(
    fontSize: 14, fontWeight: FontWeight.w500, height: 1.5,
  );
  static final TextStyle labelMedium = GoogleFonts.inter(
    fontSize: 13, fontWeight: FontWeight.w600,
  );
  static final TextStyle labelSmall = GoogleFonts.inter(
    fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 0.5,
  );
  // buttonText is always kOnPrimary (dark on green) — fixed, not adaptive
  static final TextStyle buttonText = GoogleFonts.inter(
    fontSize: 15, fontWeight: FontWeight.w600, color: kOnPrimary,
  );
}

// ── Adaptive text styles — use context.tsHeadline, context.tsBody, etc. ────
extension AppTextStylesX on BuildContext {
  // Primary-color styles
  TextStyle get tsDisplay     => AppTextStyles.display.copyWith(color: kTextPrimary);
  TextStyle get tsHeadline    => AppTextStyles.headline.copyWith(color: kTextPrimary);
  TextStyle get tsTitle       => AppTextStyles.title.copyWith(color: kTextPrimary);
  TextStyle get tsBodyPrimary => AppTextStyles.bodyPrimary.copyWith(color: kTextPrimary);
  TextStyle get tsLabel       => AppTextStyles.labelMedium.copyWith(color: kTextPrimary);
  TextStyle get tsLabelSm     => AppTextStyles.labelSmall.copyWith(color: kTextPrimary);

  // Secondary / muted-color styles
  TextStyle get tsBody        => AppTextStyles.body.copyWith(color: kTextSecondary);
  TextStyle get tsCaption     => AppTextStyles.caption.copyWith(color: kTextSecondary);

  // Button (always fixed dark-on-green)
  TextStyle get tsButton      => AppTextStyles.buttonText;
}
