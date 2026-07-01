import 'package:flutter/material.dart';
import '../theme/neo.dart';
import '../constants/app_colors.dart';

/// A Neobrutalist container with a hard border and an offset box shadow.
///
/// Pressing the box shifts it by [shadowOffset] and collapses the shadow,
/// simulating a physical key press. The animation is instant (80 ms) to
/// preserve the tactile, no-nonsense feel of the Neobrutalist aesthetic.
///
/// ```dart
/// NeoBox(
///   onTap: () => print('pressed'),
///   color: kGreen,
///   radius: Neo.rPill,
///   padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
///   child: Text('Book now'),
/// )
/// ```
class NeoBox extends StatefulWidget {
  const NeoBox({
    super.key,
    required this.child,
    this.onTap,
    this.color,
    this.borderColor,
    this.borderWidth = Neo.bwThick,
    this.radius = Neo.r,
    this.shadowOffset = Neo.shadow,
    this.padding,
    this.width,
    this.height,
  });

  final Widget child;

  /// Tap callback. When null the press animation is disabled.
  final VoidCallback? onTap;

  /// Fill colour. Defaults to transparent so [NeoBox] can wrap any widget.
  final Color? color;

  /// Border / shadow colour. Defaults to [context.kBorder] (black in light
  /// mode, white in dark mode).
  final Color? borderColor;

  /// Border width. Defaults to [Neo.bwThick] (3.0).
  final double borderWidth;

  /// Corner radius. Defaults to [Neo.r] (14.0).
  final double radius;

  /// Hard shadow offset applied when at rest.
  /// Pressing translates the box by this offset and hides the shadow.
  /// Defaults to [Neo.shadow] (4, 4).
  final Offset shadowOffset;

  final EdgeInsetsGeometry? padding;
  final double? width;
  final double? height;

  @override
  State<NeoBox> createState() => _NeoBoxState();
}

class _NeoBoxState extends State<NeoBox> {
  bool _pressed = false;

  void _down(TapDownDetails _) {
    if (widget.onTap != null) setState(() => _pressed = true);
  }

  void _up(TapUpDetails _) {
    if (widget.onTap != null) setState(() => _pressed = false);
  }

  void _cancel() {
    if (widget.onTap != null) setState(() => _pressed = false);
  }

  @override
  Widget build(BuildContext context) {
    final borderColor = widget.borderColor ?? context.kBorder;

    // When pressed: shift down-right by the shadow amount and hide the shadow.
    // The combined effect is that the element looks like it sinks into the page.
    final tx = _pressed ? widget.shadowOffset.dx : 0.0;
    final ty = _pressed ? widget.shadowOffset.dy : 0.0;

    return GestureDetector(
      onTapDown: _down,
      onTapUp: _up,
      onTapCancel: _cancel,
      onTap: widget.onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 80),
        curve: Curves.easeOut,
        width: widget.width,
        height: widget.height,
        padding: widget.padding,
        transform: Matrix4.translationValues(tx, ty, 0),
        // Keep alignment so transform is anchored to top-left (consistent
        // with the shadow direction which always goes bottom-right).
        transformAlignment: Alignment.topLeft,
        decoration: BoxDecoration(
          color: widget.color,
          borderRadius: BorderRadius.circular(widget.radius),
          border: Border.all(
            color: borderColor,
            width: widget.borderWidth,
          ),
          boxShadow: _pressed
              ? const []
              : [
                  BoxShadow(
                    color: borderColor,
                    offset: widget.shadowOffset,
                    blurRadius: 0,
                    spreadRadius: 0,
                  ),
                ],
        ),
        child: widget.child,
      ),
    );
  }
}
