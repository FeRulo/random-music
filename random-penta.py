import sys
import random
import tty
import termios
import time
from datetime import datetime
import gi
from itertools import chain
from playsound import playsound

VACIO = list("- - - - -")
CIFRADO = list("AGFEDCB")
MAX_TOP = 3
NUMERO = 16
CLAVE_FA = """---___---
  /   \  
--0--- |-
      /  
---- /---
    /    
--_/-----
         
---------"""


def flatmap(func, iterable):
    return list(chain.from_iterable(map(func, iterable)))
def trasponer(l):
    return [list(x) for x in zip(*l)]
def select_join(i,espacios):
    if i<espacios or i>len(VACIO)-1+espacios:
        return "  "
    elif (i+espacios) % 2 == 0 :
        return "--"
    else:
        return "  "
def imprimir_pentagrama(l,espacios):
    linea = list(' '*espacios) + list("|||||||||") + list(' '*espacios)
    for i in range(0,(len(l)//4+len(l)),5):
        l.insert(i,linea)
    traspuesta = trasponer(l)
    clave = trasponer(texto_a_lista_de_listas(CLAVE_FA,espacios))
    armadura= trasponer(random.choice(crear_armaduras(espacios)))
    for i in range(0,len(traspuesta)):
        print("".join(clave[i]) + "".join(armadura[i]) + select_join(i,espacios).join(traspuesta[i]))

def texto_a_lista_de_listas(texto,espacios):
    return list(map(lambda c:añadir_espacios(espacios,c),trasponer([list(fila) for fila in texto.split('\n')])))

def añadir_espacios(espacios,basico):
    return list(' '*espacios) + basico + list(' '*espacios)

def tachar_caracter(caracter):
    return caracter + '\u0336'
 
def tachar_espacios(espacios,i,new):
    if i<espacios:
        for e in range(i+(i%2)+(espacios%2),espacios, 2):
            new[e]=tachar_caracter(new[e])
    elif i>len(VACIO)-1+espacios: 
        for e in range(len(VACIO)+espacios+1,i+1, 2):
            new[e]=tachar_caracter(new[e])


def crear_notas(espacios):
    notas = []
    basico = añadir_espacios(espacios,VACIO)
    for i in range(0,len(basico)):
        new = basico.copy()
        new[i]= '0'
        if (i>len(basico)/2): 
            new[i-2]='|'
            new[i-1]='|'
        else: 
            new[i+1]='|'
            new[i+2]='|'
        tachar_espacios(espacios,i,new)
        notas.append(new)
    return notas

sostenidos = list(map(int,"2,5,1,4,7".split(",")))
bemoles =list(map(int,"6,3,7,4,8,5".split(",")))

def crear_armadura(posiciones,figura,espacios):
    armaduras = []
    for i in range(0,len(posiciones)):
        armadura=[]
        for j in range(0,i+1):
            new = VACIO.copy()
            new[posiciones[j]]= figura
            armadura.append(añadir_espacios(espacios,new))
        armadura.append(añadir_espacios(espacios,VACIO))
        armaduras.append(armadura)
    return armaduras

def crear_armaduras(espacios):
    return crear_armadura(sostenidos,'#',espacios) + crear_armadura(bemoles,'b',espacios)

def crear_pentagrama(notas,numero,ultimo_elemento=None,res = []):
    if not notas:
        return None
    elemento = random.choice(notas)
    if numero == 0:
        return res
    elif elemento == ultimo_elemento:
        return crear_pentagrama(notas,numero,ultimo_elemento,res)
    else:            
        return crear_pentagrama(notas,numero-1,elemento,res+[elemento])

def cambiar_orden(pos,lista):
    return lista[pos%len(lista):]+lista[:pos%len(lista)]
def extender_lista(lista, tamaño):
    repeticiones = tamaño // len(lista)
    resto = tamaño % len(lista)

    lista_extendida = lista * repeticiones + lista[:resto]
    return lista_extendida

def obtener_caracter():
    fd = sys.stdin.fileno()
    configuracion_original = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        # Leer un carácter del dispositivo de entrada estándar
        caracter = sys.stdin.read(1)
        print(caracter, end='', flush=True)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, configuracion_original)
    return caracter
def jugar():
    fallos = 0
    i = 0
    inicio =time.time()
    tiempo = inicio
    puntos = 0
    while i < len(notas_correspondientes):
        inp = obtener_caracter()
        if inp == "\r":
            inicio = time.time()
            print(f"\núltima: {notas_correspondientes[i]}")
            i=len(notas_correspondientes)
        elif inp.upper() != notas_correspondientes[i]:
            final=time.time()
            fallos += 1
            delta = (900+100*espacios)/(final-inicio)
            puntos -= delta
            playsound("/usr/share/sounds/gnome/default/alerts/drip.ogg")
            print(f":{i+1}✘ ",end='',flush=True)
        else:
            final = time.time()
            delta = (900+100*espacios)/(final-inicio)
            puntos += delta
            inicio = final
            print(f"✔ ",end='',flush=True)
            i += 1
    return (puntos,fallos,int(inicio-tiempo))

def registrar_puntos(puntos,fallos,tiempo,records):
    tiempo = 1 if tiempo==0 else tiempo
    print(f"\nPuntos: {int(puntos/(tiempo/NUMERO))}\tFallos: {fallos}\ttiempo: {tiempo/NUMERO}")
    new_record=(int(puntos/(tiempo/NUMERO)),datetime.now().strftime("%Y-%m-%d %H:%M"),tiempo/NUMERO)
    mayores = list(filter(lambda r:r[0]>new_record[0],records))
    if len(mayores)<=2:
        print(f"Felicidades ha superado el record {len(mayores)+1}")
    new_records = (mayores + 
                   [new_record] + 
                   list(filter(lambda r:r[0]<new_record[0],records)))[:MAX_TOP]
    lines= list(map(lambda i:f"{i+1}\t"+'\t'.join([f'{j}' for j in new_records[i]]),range(0,len(new_records))))
    for l in lines:
        print(l)
    with open('random-penta.txt', 'w') as archivo:
        archivo.write("\n".join(lines))
    return new_records

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python random-penta.py <numero>")
        sys.exit(1)
    try:
        espacios = int(sys.argv[1])
    except ValueError:
        print("El argumento debe ser un número entero.")
        sys.exit(1)
    if espacios < 0:
        print("El parámetro no puede ser negativo")
        sys.exit(1)

    records =[]
    ultimo = 0
    try:
        with open('random-penta.txt', 'r') as archivo:
            for linea in archivo:
                l= linea.strip().split("\t")
                records.append(tuple([int(l[1])]+l[2:]))
    except FileNotFoundError:
        print("archivo creado")

    for i in range(0,len(records)):
        print(f"{i+1}\t"+'\t'.join([f'{j}' for j in records[i]]))
    #os.system('cls||clear')
    notas= crear_notas(espacios)
    selec_cifrado=extender_lista(cambiar_orden(-espacios,CIFRADO),len(notas))
    zipped= list(zip(notas,selec_cifrado))
    
    while(True):
        pentagrama = crear_pentagrama(zipped,NUMERO)
        lineas,notas_correspondientes = zip(*pentagrama)
        imprimir_pentagrama(list(lineas),espacios)
        puntos,fallos,tiempo = jugar()
        records = registrar_puntos(puntos,fallos,tiempo,records)
        if(input("Otra vez(s/n)?")=='n'):
            break
    