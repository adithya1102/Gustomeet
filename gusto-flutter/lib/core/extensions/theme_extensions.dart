/// Single import that surfaces every BuildContext theme extension.
///
/// Import this one file to get:
///   context.kBg / kSurface / kBorder …    (AppColorsX)
///   context.tsHeadline / tsBody …          (AppTextStylesX)
///   context.neoShadow() / neoBorderSide …  (NeoThemeX)
///
/// Auth, Supabase, and Firebase code is never touched here.
library;

export '../constants/app_colors.dart' show AppColorsX;
export '../constants/app_text_styles.dart' show AppTextStylesX;

import 'package:flutter/material.dart';
import '../theme/neo.dart';
import '../constants/app_colors.dart';

/// Neo-specific BuildContext helpers — generated from the Neo token set.
/// These complement AppColorsX and AppTextStylesX; they do not replace them.
extension NeoThemeX on BuildContext {
  // ── Shadow factory ──────────────────────────────────────────────────────────

  /// A hard Neobrutalist [BoxShadow] with zero blur.
  /// [offset] defaults to [Neo.shadow]; [color] defaults to [kBorder].
  BoxShadow neoShadow({
    Offset offset = Neo.shadow,
    Color? color,
  }) =>
      BoxShadow(
        color: color ?? kBorder,
        offset: offset,
        blurRadius: 0,
        spreadRadius: 0,
      );

  // ── Border helpers ──────────────────────────────────────────────────────────

  /// Standard Neo border using [Neo.bw] and the current theme's border colour.
  BorderSide get neoBorderSide =>
      BorderSide(color: kBorder, width: Neo.bw);

  /// Thick Neo border using [Neo.bwThick] and the current theme's border colour.
  BorderSide get neoBorderSideThick =>
      BorderSide(color: kBorder, width: Neo.bwThick);

  // ── Shape helpers ───────────────────────────────────────────────────────────

  /// [RoundedRectangleBorder] with [Neo.r] radius and a standard border.
  RoundedRectangleBorder get neoRectBorder => RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(Neo.r),
        side: neoBorderSide,
      );

  /// [RoundedRectangleBorder] with [Neo.rLg] radius and a thick border.
  RoundedRectangleBorder get neoRectBorderLg => RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(Neo.rLg),
        side: neoBorderSideThick,
      );

  /// [RoundedRectangleBorder] with [Neo.rPill] radius and a thick border.
  RoundedRectangleBorder get neoPillBorder => RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(Neo.rPill),
        side: neoBorderSideThick,
      );

  // ── BoxDecoration shorthand ─────────────────────────────────────────────────

  /// A [BoxDecoration] with the Neo card style: surface fill, rLg radius,
  /// thick border, and default hard shadow.
  BoxDecoration neoCardDecoration({
    Color? color,
    double radius = Neo.rLg,
    Offset shadowOffset = Neo.shadow,
  }) =>
      BoxDecoration(
        color: color ?? kSurface,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: kBorder, width: Neo.bwThick),
        boxShadow: [neoShadow(offset: shadowOffset)],
      );
}
