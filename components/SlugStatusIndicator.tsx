interface SlugStatusIndicatorProps {
  slugAvailable: boolean | null;
  checkingSlug: boolean;
  isValidFormat: boolean;
  shouldShow: boolean;
}

export default function SlugStatusIndicator({
  slugAvailable,
  checkingSlug,
  isValidFormat,
  shouldShow,
}: SlugStatusIndicatorProps) {
  if (!shouldShow) return null;

  return (
    <div className="mt-2 text-sm">
      {checkingSlug ? (
        <span className="text-gray-500">Checking availability...</span>
      ) : !isValidFormat ? (
        <span className="text-red-500">✗ Invalid format</span>
      ) : slugAvailable === true ? (
        <span className="text-green-600">✓ Available</span>
      ) : slugAvailable === false ? (
        <span className="text-red-500">✗ Already taken</span>
      ) : null}
    </div>
  );
} 