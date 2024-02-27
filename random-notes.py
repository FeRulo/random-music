import sys
import random
import os

notes = "Ab,A,A#,Bb,B,C,C#,Db,D,D#,Eb,E,F,F#,Gb,G,G#".split(",")
def imprimir_numeros(n):
    for i in range(1, n+1):
        crear_linea_notas()

foo = lambda _:random.choice(notes)
def crear_linea_notas():
    print("\t".join(list(map(foo,list(range(0,9))))))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python programa.py <numero>")
        sys.exit(1)

    try:
        numero = int(sys.argv[1])
    except ValueError:
        print("El argumento debe ser un número entero.")
        sys.exit(1)
    if numero < 0:
        print("El parámetro no puede ser negativo")
        sys.exit(1)
    os.system('cls||clear')
    imprimir_numeros(numero)
    