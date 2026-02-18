import { ReactNode } from "react";

interface InfoCardProps {
  icon: ReactNode;
  label: string;
  value: string | ReactNode;
}

const InfoCard = ({ icon, label, value }: InfoCardProps) => {
  return (
    <div className="glass-effect rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="text-primary mt-0.5">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-medium text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default InfoCard;
