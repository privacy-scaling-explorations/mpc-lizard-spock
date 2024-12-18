export default function getEmoji(emoji: string): string {
  switch (emoji) {
  case 'rock':
    return '🪨';
  case 'scissors':
    return '✂️';
  case 'paper':
    return '📄';
  case 'lizard':
    return '🦎';
  case 'spock':
    return '🖖';
  default:
    return '';
  }
}
