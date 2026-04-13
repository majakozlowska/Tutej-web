import style from "./register.module.scss";
import Heading from "../../components/Heading";
import Text from "../../components/Text";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import TextLink from "../../components/TextLink";
import SearchableSelect from "../../components/SearchableSelect";
import {useState} from "react";

export function Register() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        neighborhoodId: null as number | null,
    });

    const [error, setError] = useState<string | null>(null);

    const validate = () => {
        const { fullName, email, password, neighborhoodId } = formData;

        if (!fullName || !email || !password || !neighborhoodId) {
            return "Wszystkie pola są wymagane.";
        }

        const nameParts = fullName.trim().split(/\s+/);
        if (nameParts.length < 2) {
            return "Imię i nazwisko muszą składać się z co najmniej dwóch słów.";
        }

        const isEachPartLongEnough = nameParts.every(part => part.length >= 3);
        if (!isEachPartLongEnough) {
            return "Zarówno imię, jak i nazwisko muszą mieć co najmniej 3 litery.";
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return "Wprowadź poprawny adres e-mail.";
        }

        if (password.length < 8) {
            return "Hasło musi mieć co najmniej 8 znaków.";
        }

        if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
            return "Hasło musi zawierać przynajmniej jedną wielką literę i jedną cyfrę.";
        }

        return null;
    };

    const handleRegister = async () => {
        const errorMessage = validate();

        if (errorMessage) {
            setError(errorMessage);
            return;
        }

        setError(null);

        const [firstName, lastName] = formData.fullName.trim().split(" ");

        try {
            const response = await fetch("http://localhost:5000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email: formData.email,
                    password: formData.password,
                    neighborhoodId: formData.neighborhoodId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Wystąpił błąd podczas rejestracji.");
                return;
            }

            console.log("Zarejestrowano:", data);
        } catch{
            setError("Nie można połączyć się z serwerem.");
        }
    };

    return (
        <div className={style.container}>
                <Heading text="Utwórz konto"/>
                <div className={style.form}>
                    <Text text="Twoje dane" />
                    <InputField placeholder="Imię i nazwisko" type="text" icon="letters" onChange={(val) => setFormData({...formData, fullName: val})} />
                    <InputField placeholder="Adres e-mail" type="email" icon="at" onChange={(val) => setFormData({...formData, email: val})} />
                    <InputField placeholder="Hasło" type="password" icon="lock" onChange={(val) => setFormData({...formData, password: val})} />
                    <SearchableSelect onChange={(val) => setFormData({...formData, neighborhoodId: val})} />
                    <Button text="Zarejestruj się" onClick={handleRegister} />
                    {error && <div className={style.errorMsg}>{error}</div>}
                </div>
                <div className={style.question}>
                    <Text text="Posiadasz już konto?" />
                    <TextLink to="/login" text="Zaloguj się" />
                </div>
        </div>
    );
}