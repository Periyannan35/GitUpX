import math
from typing import Dict

def calculate_shannon_entropy(data: str) -> float:
    """
    Calculates Shannon entropy H = -sum(p * log2(p)) per character.
    Flag if > 4.5 and length > 16.
    """
    if not data:
        return 0.0

    length = len(data)
    freq: Dict[str, int] = {}
    for char in data:
        freq[char] = freq.get(char, 0) + 1

    entropy = 0.0
    for count in freq.values():
        p = count / length
        entropy -= p * math.log2(p)

    return entropy

def is_high_entropy_secret(text: str, threshold: float = 4.5, min_length: int = 16) -> bool:
    if len(text) < min_length:
        return False
    
    # Ignore common text sentences with spaces
    if " " in text.strip():
        return False

    entropy = calculate_shannon_entropy(text)
    return entropy > threshold
