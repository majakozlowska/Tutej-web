import { Heading } from "../../components/Heading";
import style from "./login.module.scss";

export function Login() {
    return (
        <div className={style.container}>
            <img src="/illustrations/01.svg"  alt="Login illustration" className={style.illustration} />
            <div className={style.form}>
                <Heading text="Witamy ponownie!"/>
            </div>
        </div>
    );
}