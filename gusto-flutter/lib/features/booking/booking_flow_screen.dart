import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/constants/app_text_styles.dart';
import '../../core/utils/extensions.dart';
import '../../shared/widgets/app_bar_widget.dart';
import '../../shared/widgets/primary_button.dart';

const _purposes = [
  ('Photography', 'PHOTOGRAPHY'),
  ('Reels / Content', 'REELS_CONTENT'),
  ('Birthday', 'BIRTHDAY'),
  ('Casual Hangout', 'CASUAL_HANGOUT'),
  ('Couple Date', 'COUPLE_DATE'),
  ('Small Party', 'SMALL_PARTY'),
  ('Sports / Games', 'SPORTS_GAMES'),
  ('Music Session', 'MUSIC_SESSION'),
  ('Corporate Meet', 'CORPORATE_MEET'),
  ('Nature Time', 'NATURE_TIME'),
  ('Food & Dining', 'FOOD_DINING'),
  ('Other', 'OTHER'),
];

class BookingFlowScreen extends StatefulWidget {
  final Map<String, dynamic> params;
  const BookingFlowScreen({super.key, required this.params});

  @override
  State<BookingFlowScreen> createState() => _BookingFlowScreenState();
}

class _BookingFlowScreenState extends State<BookingFlowScreen> {
  int _guestCount = 1;
  String? _purpose;
  final _descCtrl = TextEditingController();
  bool _waiverChecked = false;

  @override
  void dispose() {
    _descCtrl.dispose();
    super.dispose();
  }

  int get _maxCapacity => widget.params['maxCapacity'] as int? ?? 20;
  int get _rate => widget.params['rate'] as int? ?? 0;

  DateTime get _start =>
      DateTime.parse(widget.params['startTime'] as String);
  DateTime get _end =>
      DateTime.parse(widget.params['endTime'] as String);

  double _multiplier(int hour) {
    if (hour >= 16 && hour < 20) return 1.5;
    if (hour >= 7 && hour < 11) return 0.8;
    if (hour >= 20) return 1.2;
    return 1.0;
  }

  @override
  Widget build(BuildContext context) {
    final durationHours = _end.difference(_start).inHours;
    final mult = _multiplier(_start.hour);
    final timeCost = (_rate * durationHours * mult).round();
    const cleaning = 150;
    const utility = 50;
    const deposit = 500;
    final subtotal = timeCost + cleaning + utility;
    final platformFee = (subtotal * 0.18).round();
    final total = subtotal + platformFee + deposit;

    return Scaffold(
      appBar: const AppBarWidget(title: 'Book Terrace'),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _TerraceHeader(
              name: widget.params['terraceName'] as String? ?? '',
              cover: widget.params['terraceCover'] as String?,
              start: _start,
              end: _end,
            ),
            const SizedBox(height: 20),
            Text('Guest count', style: context.tsTitle),
            const SizedBox(height: 12),
            _Counter(
              value: _guestCount,
              min: 1,
              max: _maxCapacity,
              onChanged: (v) => setState(() => _guestCount = v),
            ),
            const SizedBox(height: 20),
            Text('Purpose of visit', style: context.tsTitle),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _purpose,
              hint: Text('Select purpose', style: context.tsBody),
              decoration: const InputDecoration(),
              items: _purposes
                  .map((p) => DropdownMenuItem(
                      value: p.$2, child: Text(p.$1)))
                  .toList(),
              onChanged: (v) => setState(() => _purpose = v),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _descCtrl,
              maxLines: 2,
              decoration: const InputDecoration(
                hintText: 'Add more details (optional)',
              ),
            ),
            const SizedBox(height: 20),
            _PricingBreakdown(
              durationHours: durationHours,
              timeCost: timeCost,
              mult: mult,
              cleaning: cleaning,
              utility: utility,
              deposit: deposit,
              platformFee: platformFee,
              total: total,
            ),
            const SizedBox(height: 20),
            CheckboxListTile(
              value: _waiverChecked,
              onChanged: (v) => setState(() => _waiverChecked = v ?? false),
              title: Text(AppStrings.waiverText, style: context.tsCaption),
              controlAffinity: ListTileControlAffinity.leading,
              contentPadding: EdgeInsets.zero,
              activeColor: kGreen,
            ),
            const SizedBox(height: 24),
            PrimaryButton(
              label: 'Proceed to Confirm',
              onPressed: (_waiverChecked && _purpose != null)
                  ? () {
                      context.push('/booking/confirm', extra: {
                        ...widget.params,
                        'guestCount': _guestCount,
                        'purpose': _purpose,
                        'totalCharged': total.toDouble(),
                        'timeCost': timeCost.toDouble(),
                        'platformFee': platformFee.toDouble(),
                      });
                    }
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}

class _TerraceHeader extends StatelessWidget {
  final String name;
  final String? cover;
  final DateTime start;
  final DateTime end;

  const _TerraceHeader({
    required this.name,
    this.cover,
    required this.start,
    required this.end,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: context.kSurface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.kBorder),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: cover != null
                ? Image.network(
                    cover!,
                    width: 64,
                    height: 64,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      width: 64,
                      height: 64,
                      color: context.kBorder,
                      child: Icon(Icons.broken_image_outlined,
                          color: context.kTextSecondary),
                    ),
                  )
                : Container(
                    width: 64,
                    height: 64,
                    color: context.kBorder,
                    child: Icon(Icons.landscape_outlined,
                        color: context.kTextSecondary)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                    style: context.tsLabel,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: 4),
                Text(
                  DateFormat('EEE, MMM d').format(start),
                  style: context.tsBody,
                ),
                Text(
                  '${DateFormat('h:mm a').format(start)} – ${DateFormat('h:mm a').format(end)}',
                  style: context.tsCaption,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Counter extends StatelessWidget {
  final int value;
  final int min;
  final int max;
  final ValueChanged<int> onChanged;

  const _Counter({
    required this.value,
    required this.min,
    required this.max,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: context.kSurface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: context.kBorder),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text('$value guest${value > 1 ? 's' : ''}',
              style: context.tsBodyPrimary),
          Row(
            children: [
              IconButton(
                onPressed: value > min ? () => onChanged(value - 1) : null,
                icon: const Icon(Icons.remove_circle_outline),
                color: kGreen,
                disabledColor: context.kBorder,
              ),
              IconButton(
                onPressed: value < max ? () => onChanged(value + 1) : null,
                icon: const Icon(Icons.add_circle_outline),
                color: kGreen,
                disabledColor: context.kBorder,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PricingBreakdown extends StatelessWidget {
  final int durationHours;
  final int timeCost;
  final double mult;
  final int cleaning;
  final int utility;
  final int deposit;
  final int platformFee;
  final int total;

  const _PricingBreakdown({
    required this.durationHours,
    required this.timeCost,
    required this.mult,
    required this.cleaning,
    required this.utility,
    required this.deposit,
    required this.platformFee,
    required this.total,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.kSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.kBorder),
      ),
      child: Column(
        children: [
          _PriceRow('Base rate ($durationHours ${durationHours == 1 ? "hr" : "hrs"}${mult != 1.0 ? " × ${mult}x" : ""})',
              timeCost.inr),
          _PriceRow('Cleaning fee', cleaning.inr),
          _PriceRow('Utility fee', utility.inr),
          _PriceRow('Platform fee (18%)', platformFee.inr),
          Divider(color: context.kBorder, height: 20),
          _PriceRow('Security deposit (refundable)', deposit.inr,
              isNote: true),
          Divider(color: context.kBorder, height: 20),
          _PriceRow('Total payable', total.inr, isBold: true),
        ],
      ),
    );
  }
}

class _PriceRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isBold;
  final bool isNote;

  const _PriceRow(this.label, this.value,
      {this.isBold = false, this.isNote = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: TextStyle(
                  fontSize: 13,
                  color: isNote
                      ? context.kTextSecondary
                      : context.kTextPrimary,
                  fontWeight:
                      isBold ? FontWeight.w600 : FontWeight.normal)),
          Text(value,
              style: TextStyle(
                  fontSize: 13,
                  color: context.kTextPrimary,
                  fontWeight:
                      isBold ? FontWeight.bold : FontWeight.normal)),
        ],
      ),
    );
  }
}
