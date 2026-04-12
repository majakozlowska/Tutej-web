import style from "./register.module.scss";
import Heading from "../../components/Heading";
import Text from "../../components/Text";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import TextLink from "../../components/TextLink";
import SearchableSelect from "../../components/SearchableSelect";
import {useState} from "react";

export function Register() {
    const [neighborhoodId, setNeighborhoodId] = useState<number | null>(null);

    const handleRegister = () => {
        const registrationData = {
            neighborhoodId,
        };

        console.log(registrationData);
    };

    return (
        <div className={style.container}>
                <Heading text="Utwórz konto"/>
                <div className={style.form}>
                    <Text text="Twoje dane" />
                    <InputField placeholder="Imię i nazwisko" type="text" icon="letters" />
                    <InputField placeholder="Adres e-mail" type="email" icon="at" />
                    <InputField placeholder="Hasło" type="password" icon="lock" />
                    <SearchableSelect onChange={(id) => setNeighborhoodId(id)} />
                    <Button text="Zarejestruj się" onClick={handleRegister} />
                </div>
                <div className={style.question}>
                    <Text text="Posiadasz już konto?" />
                    <TextLink to="/login" text="Zaloguj się" />
                </div>
        </div>
    );
}