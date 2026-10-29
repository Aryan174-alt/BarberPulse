import re


SERVICE_TERMS = {
    'haircut': ('haircut', 'hair cut', 'cut', 'baal kat'),
    'beard trim': ('beard trim', 'beard', 'trim', 'daadhi'),
    'shave': ('shave', 'shaving', 'clean shave'),
}


def parse_message(message):
    text = message.lower().strip()
    service = next(
        (canonical for canonical, terms in SERVICE_TERMS.items() if any(term in text for term in terms)),
        None,
    )
    price_match = re.search(
        r'(?:under|below|less than|upto|up to|₹|rs\.?)\s*₹?\s*(-?\d+)',
        text,
    )
    if not price_match:
        price_match = re.search(r'₹\s*(-?\d+)', text)
    if not price_match:
        price_match = re.search(r'(-?\d+)\s*(?:rupees?|rs)\s*(?:ke andar|tak)', text)
    max_price = int(price_match.group(1)) if price_match else None
    duration_match = re.search(r'(?:next|within|in)\s+(\d+)\s*(hours?|hrs?|minutes?|mins?)', text)
    within_minutes = None
    if duration_match:
        amount = int(duration_match.group(1))
        unit = duration_match.group(2)
        within_minutes = amount * 60 if unit.startswith(('hour', 'hr')) else amount
    elif 'kal subah' in text or 'tomorrow morning' in text:
        within_minutes = 1440
    if any(word in text for word in ('sasta', 'cheap', 'cheapest')):
        priority = 'cheapest'
    elif 'fastest' in text or 'quickest' in text or 'jaldi' in text:
        priority = 'fastest'
    elif 'nearest' in text or 'closest' in text or 'near me' in text:
        priority = 'nearest'
    else:
        priority = 'fastest'

    return {
        'service': service,
        'within_minutes': within_minutes,
        'max_price': max_price,
        'priority': priority,
        'time_window': 'tomorrow morning' if 'kal subah' in text or 'tomorrow morning' in text else None,
    }
