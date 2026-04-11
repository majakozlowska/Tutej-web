import style from "./login.module.scss";
import { Heading } from "../../components/Heading";
import { Text } from "../../components/Text";

export function Login() {
    return (
        <div className={style.mainContainer}>
            <img src="/illustrations/01.svg"  alt="Login illustration" className={style.illustration} />
            <div className={style.container}>
                <Heading text="Witamy ponownie!"/>
                <div className={style.form}>
                    <Text text="Twoje dane" />
                </div>
                <Text text="Nie posiadasz jeszcze konta?" />
            </div>
        </div>
    );
}