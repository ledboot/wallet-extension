import { useWallet } from "@/ui/utils/walletContext";
import { useNavigate } from "../mainRoute";

export default function WelcomeScreen() {
    const wallet = useWallet();
    const navigate = useNavigate();
    

  return (
    <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-xl font-bold mb-4">Welcome to the ANEX extension</div>
        <div className="flex flex-col gap-2">
        <button className="btn rounded-md" onClick={ async ()=>{
            const isBooted = await wallet.isBooted();
            if(isBooted){
                navigate('CreateOrImportWalletScreen',{newWallet:true});
            }else{
                navigate('CreatePasswordScreen',{newWallet:true});
            }
        }}>Create Wallet</button>
        <button className="btn rounded-md" onClick={async ()=>{
            const isBooted = await wallet.isBooted();
            if(isBooted){
                navigate('CreateOrImportWalletScreen',{importWallet:true});
            }else{
                navigate('CreatePasswordScreen',{importWallet:true});
            }
        }}>Import Wallet</button>
        </div>
    </div>
  );
}