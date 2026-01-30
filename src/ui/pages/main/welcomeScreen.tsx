import { useWallet } from "@/ui/utils/walletContext";
import { useNavigate } from "../mainRoute";
import { useLanguage } from "@/ui/contexts/LanguageContext";

export default function WelcomeScreen() {
    const wallet = useWallet();
    const navigate = useNavigate();
    const { t } = useLanguage();
    

  return (
    <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-xl font-bold mb-4">{t('welcome.title')}</div>
        <div className="flex flex-col gap-2">
        <button className="btn rounded-md" onClick={ async ()=>{
            const isBooted = await wallet.isBooted();
            if(isBooted){
                navigate('CreateOrImportWalletScreen',{newWallet:true});
            }else{
                navigate('CreatePasswordScreen',{newWallet:true});
            }
        }}>{t('account.create_wallet')}</button>
        <button className="btn rounded-md" onClick={async ()=>{
            const isBooted = await wallet.isBooted();
            if(isBooted){
                navigate('CreateOrImportWalletScreen',{importWallet:true});
            }else{
                navigate('CreatePasswordScreen',{importWallet:true});
            }
        }}>{t('account.import_wallet')}</button>
        </div>
    </div>
  );
}