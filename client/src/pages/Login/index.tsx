import { Heading } from "../../components/Heading";
import style from "./login.module.scss";

export function Login() {
    return (
        <div className={style.container}>
            <Heading text="Witamy ponownie!"/>
        </div>
    );
}