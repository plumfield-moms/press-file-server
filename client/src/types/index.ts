import {z} from "zod"
const Roles = z.enum(["admin", "user"])
export const ProofModel = z.object({
  id: z.string(),
  stage: z.string(),
  notes: z.string().nullish(),
  title: z.string(),
  can_edit: z.boolean()
})


export const UserModel = z.object({
  email: z.email(),
  username: z.string(),
  role: Roles,
  name: z.string()
})


export type Proof = z.infer<typeof ProofModel>
export const ProofArrayModel = z.array(ProofModel)
export type ProofArray = z.infer<typeof ProofArrayModel>
export type User = z.infer<typeof UserModel>
export type ProofUpdate =  Proof & {
  setTitle: (title: string)=>void,
  // setStage: (stage: string) => void, // Enable if the admin can change the stage
  setNotes: (notes: string)=> void,

}
export interface ProofHandlers {
  // download: ()=> void
  submit: (file: File) => void
}