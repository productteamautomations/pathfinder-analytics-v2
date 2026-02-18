interface ScoreCardProps {
  label: string;
  value: string;
  color?: "default" | "success" | "warning" | "danger";
}

const ScoreCard = ({ label, value, color = "default" }: ScoreCardProps) => {
  const numericValue = parseInt(value.replace("%", "")) || 0;
  
  const getColor = () => {
    if (color !== "default") {
      switch (color) {
        case "success": return { text: "text-emerald-700", bar: "bg-emerald-500" };
        case "warning": return { text: "text-amber-700", bar: "bg-amber-500" };
        case "danger": return { text: "text-red-600", bar: "bg-red-500" };
      }
    }
    if (numericValue >= 60) return { text: "text-emerald-700", bar: "bg-emerald-500" };
    if (numericValue >= 40) return { text: "text-amber-700", bar: "bg-amber-500" };
    return { text: "text-red-600", bar: "bg-red-500" };
  };

  const colors = getColor();

  return (
    <div className="bg-white border border-border rounded-xl p-4 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-xl font-bold ${colors.text} tabular-nums`}>{value}</p>
      {numericValue > 0 && (
        <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full ${colors.bar} transition-all`}
            style={{ width: `${Math.min(numericValue, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default ScoreCard;
