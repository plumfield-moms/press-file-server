import { ArrowRight } from 'lucide-react';
import { Proof } from '@/types';
import { Card } from '@/components/ui/card';

interface StageColumnProps {
  title: string;
  proofs: Proof[];
  onView: (id: string) => void;
}

export function StageColumn({ title, proofs, onView }: StageColumnProps) {
  return (
    <div className="w-[320px] shrink-0 flex flex-col font-sans">
      <h3 className="font-serif text-lg font-black mb-6 text-plum flex items-center justify-between border-b-2 border-plum/10 pb-2">
        <span>{title}</span>
        <span className="text-xs font-mono opacity-40">{proofs.length}</span>
      </h3>
      <div className="space-y-4">
        {proofs.map((proof) => (
          <Card
            key={proof.id}
            onClick={() => onView(proof.id)}
            className="bg-white/85 backdrop-blur-sm p-5 rounded-2xl border border-plum/5 shadow-sm hover:shadow-md hover:border-plum/20 cursor-pointer transition-all flex justify-between items-center group relative overflow-hidden ring-0"
          >
            {proof.has_notes && (
              <div className="absolute top-0 right-0 w-2.5 h-full bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors" />
            )}
            <div className="min-w-0 flex-1 mr-4">
              <div className="font-black text-gray-900 text-base group-hover:text-plum transition-colors truncate tracking-tight">
                {proof.id}
              </div>
              {proof.has_notes && (
                <div className="text-[10px] text-blue-600 font-black uppercase mt-1 tracking-tighter">
                  Editorial Notes attached
                </div>
              )}
            </div>
            <ArrowRight
              size={18}
              className="text-plum/20 group-hover:text-plum group-hover:translate-x-1 transition-all flex-shrink-0"
            />
          </Card>
        ))}
        {proofs.length === 0 && (
          <div className="text-plum/20 text-xs text-center py-12 font-serif italic border-2 border-dashed border-plum/10 rounded-2xl bg-white/10">
            No active proofs
          </div>
        )}
      </div>
    </div>
  );
}
