import style from "./login.module.scss";
import Heading from "../../components/Heading";
import Text from "../../components/Text";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import TextLink from "../../components/TextLink";

export function Login() {
    return (
        <div className={style.mainContainer}>
            <img src="/illustrations/01.svg"  alt="Login illustration" className={style.illustration} />
            <div className={style.container}>
                <Heading text="Witamy ponownie!"/>
                <div className={style.form}>
                    <Text text="Twoje dane" />
                    <InputField placeholder="Adres e-mail" type="email" icon="at" />
                    <InputField placeholder="Hasło" type="password" icon="lock" />
                    <Button text="Zaloguj się" />
                </div>
                <div className={style.question}>
                    <Text text="Nie posiadasz jeszcze konta?" />
                    <TextLink to="/register" text="Zarejestruj się" />
                </div>
            </div>
        </div>
    );
}