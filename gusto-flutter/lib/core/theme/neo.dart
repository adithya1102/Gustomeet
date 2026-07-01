import 'dart:ui' show Offset;

/// Neobrutalist design tokens — single source of truth for every
/// border, radius, and hard-shadow value used across the app.
///
/// Usage:
///   BorderRadius.circular(Neo.rLg)
///   BoxShadow(offset: Neo.shadow, blurRadius: 0)
///   BorderSide(width: Neo.bwThick)
abstract final class Neo {
  // ── Corner radii ─────────────────────────────────────────────────────────────
  static const double rSm   = 8.0;   // tight corners — tags, badges
  static const double r     = 14.0;  // default card / container
  static const double rLg   = 20.0;  // large panels, bottom sheets
  static const double rPill = 40.0;  // buttons, inputs, chips

  // ── Border widths ─────────────────────────────────────────────────────────────
  static const double bw      = 2.5; // standard border
  static const double bwThick = 3.0; // primary / interactive border

  // ── Hard shadow offsets (blurRadius is always 0 in Neobrutalism) ─────────────
  static const Offset shadowSm = Offset(3, 3); // subtle press / tag
  static const Offset shadow   = Offset(4, 4); // default card shadow
  static const Offset shadowLg = Offset(6, 6); // hero / large element
}
