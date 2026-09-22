import {ProofArray} from "@/types";
import {Separator} from "@/components/ui/separator";
import {Card, CardAction, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {Clock} from "lucide-react";

export function ProofColumns({proofs, setActive, stage}:{proofs: ProofArray, setActive: (proof_id: string)=>void, stage: string}){
    const stages = ["kristi", "ed","diane","sara","greta", "done"]
    const Sections = stages.map((s)=> <div className="flex flex-col p-2 gap-1">
        <span className="text-start font-bold">{s.charAt(0).toUpperCase() + s.slice(1)}</span>
        <Separator className="bg-background"/>
        <div>
            {proofs.filter((p)=>p.stage==s).length > 0 ? proofs.filter((p)=>p.stage==s).map((p)=>(
                <div className="py-1">
                <Card onClick={()=>setActive(p.id)} key={p.id} className="hover:bg-muted">
                    <CardHeader>
                        <CardTitle>{p.title}</CardTitle>
                        {stage == s &&
                        <CardAction><Badge className={"bg-amber-600"}><Clock data-icon="inline-start"/> Waiting</Badge></CardAction>
                        }
                    </CardHeader>
                </Card>
                </div>
            )) : <div className="p-4 text-center rounded-md bg-accent "><span>No proofs at this stage</span></div>}
        </div>
    </div>
    )
    return <div className="w-full sm:w-100 flex flex-col rounded-md  bg-primary text-background p-4 h-screen overflow-y-auto scroll-fade">{Sections}</div>

}