"use client"

import { Link } from "@/src/i18n/routing";
import { useTranslations } from "next-intl";

export type UserObj = {
    fullName: string;
}

export default function Homepage({userObj}: {userObj: UserObj | null}) {
    const time= new Date().getHours();
    const tHome = useTranslations("Home");
    const tCommon = useTranslations("Common");
    const greeting = time < 12 ? tCommon("goodMorning") : time < 18 ? tCommon("goodAfternoon") : tCommon("goodEvening");
    
    return(
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-black font-sans">
      <h1 className="text-2xl font-semibold">{tHome("title")}</h1>
      <p className="mt-2 text-sm">
        {userObj?.fullName ? `${greeting}, ${userObj.fullName}!` : tCommon("signedOut")}
      </p>
      <p className="mt-4 text-center text-gray-600 dark:text-gray-400 max-w-md">
        “{tHome("subtitle1")}”
        “{tHome("subtitle2")}”    
      </p>

      <Link href="/assistant" className="mt-6 bg-purple-700 text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 flex items-center justify-center px-4 sm:px-5 cursor-pointer">
        {tHome("getStarted")}
      </Link>
      <Link href="/flashcards" className="mt-6 bg-purple-700 text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 flex items-center justify-center px-4 sm:px-5 cursor-pointer">
        {tHome("flashcards")}
      </Link>
    </div>
    )
}
