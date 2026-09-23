const translations = import.meta.glob("../gamedata/*/strings.json", {
  eager: true,
  import: "default",
});

export function loadTranslations(language) {
  return (
    translations[`../gamedata/${language}/strings.json`] ??
    translations["../gamedata/en/strings.json"]
  );
}
