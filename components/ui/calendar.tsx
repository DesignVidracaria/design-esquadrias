"use client"

import * as React from "react"
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { type DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"
import { ptBR } from "date-fns/locale" // Adicionando localização em português

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={ptBR} // Configurando localização em português
      className={cn(
        "bg-white group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-white [[data-slot=popover-content]_&]:bg-white text-black", // Forçando fundo branco e texto preto
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString("pt-BR", { month: "long" }), // Formatação em português
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit text-black", defaultClassNames.root), // Texto preto
        months: cn(
          "flex gap-4 flex-col md:flex-row relative text-black", // Texto preto
          defaultClassNames.months,
        ),
        month: cn("flex flex-col w-full gap-4 text-black", defaultClassNames.month), // Texto preto
        nav: cn(
          "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between text-black", // Texto preto
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none text-black hover:text-black", // Texto preto
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none text-black hover:text-black", // Texto preto
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex items-center justify-center h-(--cell-size) w-full px-(--cell-size) text-black", // Texto preto
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "w-full flex items-center text-sm font-medium justify-center h-(--cell-size) gap-1.5 text-black", // Texto preto
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "relative has-focus:border-ring border border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] rounded-md text-black", // Texto preto
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn(
          "absolute bg-white inset-0 opacity-0 text-black", // Fundo branco e texto preto
          defaultClassNames.dropdown,
        ),
        caption_label: cn(
          "select-none font-medium text-black", // Texto preto
          captionLayout === "label"
            ? "text-sm"
            : "rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-black [&>svg]:size-3.5", // Ícones pretos
          defaultClassNames.caption_label,
        ),
        table: "w-full border-collapse text-black", // Texto preto
        weekdays: cn("flex text-black", defaultClassNames.weekdays), // Texto preto
        weekday: cn(
          "text-black rounded-md flex-1 font-normal text-[0.8rem] select-none", // Texto preto ao invés de muted-foreground
          defaultClassNames.weekday,
        ),
        week: cn("flex w-full mt-2 text-black", defaultClassNames.week), // Texto preto
        week_number_header: cn(
          "select-none w-(--cell-size) text-black", // Texto preto
          defaultClassNames.week_number_header,
        ),
        week_number: cn(
          "text-[0.8rem] select-none text-black", // Texto preto ao invés de muted-foreground
          defaultClassNames.week_number,
        ),
        day: cn(
          "relative w-full h-full p-0 text-center text-black [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none", // Texto preto
          defaultClassNames.day,
        ),
        range_start: cn(
          "rounded-l-md bg-blue-100 text-black", // Fundo azul claro e texto preto
          defaultClassNames.range_start,
        ),
        range_middle: cn("rounded-none bg-blue-50 text-black", defaultClassNames.range_middle), // Texto preto
        range_end: cn("rounded-r-md bg-blue-100 text-black", defaultClassNames.range_end), // Texto preto
        today: cn(
          "bg-blue-100 text-black rounded-md data-[selected=true]:rounded-none font-bold", // Fundo azul claro, texto preto e negrito
          defaultClassNames.today,
        ),
        outside: cn(
          "text-gray-400 aria-selected:text-gray-400", // Texto cinza claro para dias fora do mês
          defaultClassNames.outside,
        ),
        disabled: cn(
          "text-gray-300 opacity-50", // Texto cinza claro para dias desabilitados
          defaultClassNames.disabled,
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn("text-black", className)} // Texto preto
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4 text-black", className)} {...props} /> // Ícone preto
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4 text-black", className)} // Ícone preto
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4 text-black", className)} {...props} /> // Ícone preto
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center text-black">
                {" "}
                // Texto preto
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({ className, day, modifiers, ...props }: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "text-black hover:text-black data-[selected-single=true]:bg-blue-500 data-[selected-single=true]:text-white data-[range-middle=true]:bg-blue-100 data-[range-middle=true]:text-black data-[range-start=true]:bg-blue-500 data-[range-start=true]:text-white data-[range-end=true]:bg-blue-500 data-[range-end=true]:text-white group-data-[focused=true]/day:border-blue-500 group-data-[focused=true]/day:ring-blue-500/50 hover:bg-blue-50 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&>span]:text-xs [&>span]:opacity-70", // Cores personalizadas com texto preto e seleção azul
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
